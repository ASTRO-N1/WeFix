"use client";
import { useComplaints } from "../../context/ComplaintContext";
import ComplaintList from "../../components/ComplaintList";

const ViewComplaintsPage = () => {
  const { loading } = useComplaints();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Submitted Complaints</h1>
      {loading ? <p>Loading...</p> : <ComplaintList />}
    </div>
  );
};

export default ViewComplaintsPage;
