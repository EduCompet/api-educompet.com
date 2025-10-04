// src/app/api/search/route.js
import { NextResponse } from "next/server";
import { connectdb } from "@/app/database/mongodb";
import ChapterModel from "@/app/model/chapterDataModel/schema";
import GeneralChapterModel from "@/app/model/generalChaptersDataModel/schema";
import SubjectModel from "@/app/model/subjectDataModel/schema";
import GeneralSubjectModel from "@/app/model/generalSubjectDataModel/schema";
import { headers } from "next/headers";
import { withCors, handleOptions } from "@/app/utils/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return handleOptions();
}

export const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 3) {
    return withCors(
      NextResponse.json(
        { success: false, message: "Query must be at least 3 characters long." },
        { status: 400 }
      )
    );
  }

  try {
    await connectdb();
    const searchRegex = new RegExp(query, "i"); // Case-insensitive search

    // Parallel searches for better performance
    const [subjects, generalSubjects, chapters, generalChapters] = await Promise.all([
      SubjectModel.find({ name: searchRegex }).populate("classId", "name").lean(),
      GeneralSubjectModel.find({ name: searchRegex }).lean(),
      ChapterModel.find({ name: searchRegex }).populate("subjectId", "name classId").lean(),
      GeneralChapterModel.find({ name: searchRegex }).populate("generalSubjectId", "name").lean(),
    ]);

    const results = [
      ...subjects.map(s => ({
        id: s._id,
        name: s.name,
        type: 'Subject',
        parentName: s.classId.name,
        parentId: s.classId._id,
        classId: s.classId._id,
        isGeneral: false,
      })),
      ...generalSubjects.map(s => ({
        id: s._id,
        name: s.name,
        type: 'General Subject',
        parentName: 'General',
        parentId: s._id,
        isGeneral: true,
      })),
       ...chapters.map(c => ({
        id: c._id,
        name: c.name,
        type: 'Chapter',
        parentName: c.subjectId.name,
        parentId: c.subjectId._id,
        classId: c.subjectId.classId,
        isGeneral: false,
      })),
      ...generalChapters.map(c => ({
        id: c._id,
        name: c.name,
        type: 'Chapter',
        parentName: c.generalSubjectId.name,
        parentId: c.generalSubjectId._id,
        isGeneral: true,
      })),
    ];

    return withCors(
      NextResponse.json({ success: true, data: results }, { status: 200 })
    );

  } catch (error) {
    console.error("Search error:", error);
    return withCors(
      NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 })
    );
  }
};