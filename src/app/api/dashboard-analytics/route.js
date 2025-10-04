// src/app/api/dashboard-analytics/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import TransactionModel from "@/app/model/transactionModel/schema";
import UserModel from "@/app/model/userDataModel/schema";
import UserSubscriptionModel from "@/app/model/userSubscriptionModel/schema";
import SubscriptionModel from "@/app/model/subscriptionsDataModel/schema";
import { headers } from "next/headers";
import { withCors, handleOptions } from "@/app/utils/cors";

export const dynamic = "force-dynamic";
const xkey = process.env.API_AUTH_KEY;

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async () => {
  const headerList = await headers();
  const reqApiKey = headerList.get("x-api-key");
  if (xkey !== reqApiKey) {
    return withCors(NextResponse.json({ success: false, message: "Invalid API Auth Key" }, { status: 401 }));
  }

  try {
    await connectdb();

    const now = new Date();
    const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const oneYearAgo = new Date(new Date().setFullYear(now.getFullYear() - 1));
    const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30));

    // --- Parallel Queries ---
    const totalRevenuePromise = TransactionModel.aggregate([{ $match: { status: "success" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
    const thisMonthRevenuePromise = TransactionModel.aggregate([{ $match: { status: "success", createdAt: { $gte: firstDayOfThisMonth } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
    const lastMonthRevenuePromise = TransactionModel.aggregate([{ $match: { status: "success", createdAt: { $gte: firstDayOfLastMonth, $lt: firstDayOfThisMonth } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
    
    const totalUsersPromise = UserModel.countDocuments();
    const newUsersThisMonthPromise = UserModel.countDocuments({ createdAt: { $gte: firstDayOfThisMonth } });
    const activeUsersPromise = UserModel.countDocuments({ lastLogin: { $gte: new Date(now - 24 * 60 * 60 * 1000) } });

    const totalSubscriptionsPromise = UserSubscriptionModel.aggregate([{ $unwind: "$subscriptions" }, { $count: "total" }]);
    const activeSubscriptionsPromise = UserSubscriptionModel.aggregate([{ $unwind: "$subscriptions" }, { $match: { "subscriptions.status": "active" } }, { $count: "total" }]);
    const newSubscriptionsThisMonthPromise = UserSubscriptionModel.aggregate([{ $unwind: "$subscriptions" }, { $match: { "subscriptions.startDate": { $gte: firstDayOfThisMonth } } }, { $count: "total" }]);

    const popularPlansPromise = TransactionModel.aggregate([
      { $match: { status: "success" } }, { $group: { _id: "$subscriptionId", value: { $sum: 1 } } },
      { $sort: { value: -1 } }, { $limit: 5 },
      { $lookup: { from: 'subscriptions', localField: '_id', foreignField: '_id', as: 'planDetails' } },
      { $unwind: "$planDetails" }, { $project: { name: "$planDetails.name", value: 1 } }
    ]);

    const latestTransactionsPromise = TransactionModel.find({ status: "success" }).sort({ createdAt: -1 }).limit(5).select("amount status createdAt description").lean();
    
    const monthlyRevenueChartPromise = TransactionModel.aggregate([
        { $match: { status: "success", createdAt: { $gte: oneYearAgo } } },
        { $group: { _id: { month: { $month: "$createdAt" } }, revenue: { $sum: "$amount" }}},
        { $sort: { "_id.month": 1 } }
    ]);
    
    const userGrowthChartPromise = UserModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }}},
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, users: { $sum: 1 }}},
        { $sort: { _id: 1 } }
    ]);
    
    const subscriptionGrowthChartPromise = UserSubscriptionModel.aggregate([
        { $unwind: "$subscriptions" },
        { $match: { "subscriptions.startDate": { $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) } } },
        { $group: { _id: { year: { $year: "$subscriptions.startDate" }, month: { $month: "$subscriptions.startDate" } }, subscriptions: { $sum: 1 }}},
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const [
      totalRevenueResult, thisMonthRevenueResult, lastMonthRevenueResult, totalUsers, newUsersThisMonth, activeUsers,
      totalSubscriptionsResult, activeSubscriptionsResult, newSubscriptionsThisMonthResult, popularPlans,
      latestTransactions, monthlyRevenueChartData, userGrowthChartData, subscriptionGrowthChartData
    ] = await Promise.all([
      totalRevenuePromise, thisMonthRevenuePromise, lastMonthRevenuePromise, totalUsersPromise, newUsersThisMonthPromise, activeUsersPromise,
      totalSubscriptionsPromise, activeSubscriptionsPromise, newSubscriptionsThisMonthPromise, popularPlansPromise,
      latestTransactionsPromise, monthlyRevenueChartPromise, userGrowthChartPromise, subscriptionGrowthChartPromise
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const monthlyRevenue = thisMonthRevenueResult[0]?.total || 0;
    const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;
    const revenueGrowth = lastMonthRevenue > 0 ? Number((((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)) : (monthlyRevenue > 0 ? 100 : 0);
    const avgSubscriptionValue = totalSubscriptionsResult[0]?.total > 0 ? Number((totalRevenue / totalSubscriptionsResult[0]?.total).toFixed(2)) : 0;
    const engagementRate = totalUsers > 0 ? Number(((activeUsers / totalUsers) * 100).toFixed(1)) : 0;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedMonthlyRevenue = monthNames.map((monthName, index) => ({
        month: monthName,
        revenue: monthlyRevenueChartData.find(d => d._id.month === index + 1)?.revenue || 0,
    }));
    
    const formattedSubscriptionGrowth = Array.from({ length: 12 }).map((_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const monthName = monthNames[d.getMonth()];
        const entry = subscriptionGrowthChartData.find(item => item._id.year === year && item._id.month === month);
        return { month: monthName, subscriptions: entry ? entry.subscriptions : 0 };
    });

    const formattedUserGrowth = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - 29 + i);
      const dateString = d.toISOString().split('T')[0];
      const entry = userGrowthChartData.find(item => item._id === dateString);
      return { date: `${d.getDate()}/${d.getMonth() + 1}`, Users: entry ? entry.users : 0 };
    });

    return withCors(NextResponse.json({
      success: true,
      data: {
        totalRevenue, monthlyRevenue, growth: revenueGrowth, revenueData: formattedMonthlyRevenue, latestTransactions,
        totalSubscriptions: totalSubscriptionsResult[0]?.total || 0,
        activeSubscriptions: activeSubscriptionsResult[0]?.total || 0,
        newSubscriptions: newSubscriptionsThisMonthResult[0]?.total || 0,
        avgSubscriptionValue, growthData: formattedSubscriptionGrowth, popular: popularPlans, churnRate: 0,
        totalUsers, newUsers: newUsersThisMonth, activeUsers, userGrowth: formattedUserGrowth, engagementRate, retentionRate: 0,
      }
    }, { status: 200 }));
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    return withCors(NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 }));
  }
};