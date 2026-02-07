/**
 * Job Details Page
 * 
 * Handles direct URL access to /jobs/:jobId
 * Wraps the job board with an auto-opened modal for the specified job.
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import JobBoardPage from "./JobBoardPage";
import { JobDetailsModal } from "./JobDetailsModal";

export default function JobDetailsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(!!jobId);

  // Keep modal open state synced with jobId presence
  useEffect(() => {
    if (jobId) {
      setModalOpen(true);
    }
  }, [jobId]);

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      // Navigate back to job board when modal closes
      navigate("/jobs", { replace: true });
    }
  };

  return (
    <>
      <JobBoardPage />
      <JobDetailsModal
        jobId={jobId ?? null}
        open={modalOpen}
        onOpenChange={handleModalClose}
      />
    </>
  );
}

