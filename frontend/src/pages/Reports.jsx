import ReportTable from "../components/ReportTable";

const Reports = () => {
  const reportData = [
    { developer: "John Doe", completedTasks: 5, pendingTasks: 2 },
    { developer: "Jane Smith", completedTasks: 7, pendingTasks: 1 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <ReportTable data={reportData} />
    </div>
  );
};

export default Reports;