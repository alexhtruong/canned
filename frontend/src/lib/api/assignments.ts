/* eslint-disable @typescript-eslint/no-explicit-any */
import { getApiUrl } from "@/lib/config";

export const fetchAssignments = async () => {
    const apiUrl = getApiUrl();
    try {
      const response = await fetch(`${apiUrl}/assignments?canvas_user_id=1`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log(data)
      return data
    } catch (e) {
      console.error(e);
    }
};

export const transformAssignments = (data: any[]) => {
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data.map((assignment: any) => {
      const courseCodeAndName = assignment.course_name.split(" - ", 2)
      const courseCode = courseCodeAndName[0];
      const courseName = courseCodeAndName[1];

      return {
        id: assignment.id.toString(),
        name: assignment.name,
        courseCode: courseCode,
        courseName: courseName,
        dueDate: assignment.due_at,
        graded: assignment.graded,
        submitted: assignment.submission.submitted_at ? true : false,
        isLocallyComplete: assignment.submission.is_locally_complete || false,
        points: assignment.points_possible,
        canvasUrl: assignment.html_url,
        description: assignment.description
      }
    });
  }