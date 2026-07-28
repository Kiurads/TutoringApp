-- Covers fetchOpenRequestsForTeacher's exact filter shape (teacherId, status,
-- subjectId) directly, rather than falling back to a subjectId-less index
-- scan plus a full row filter on every open-request lookup.
CREATE INDEX `Class_teacherId_status_subjectId_idx` ON `Class`(`teacherId`, `status`, `subjectId`);
