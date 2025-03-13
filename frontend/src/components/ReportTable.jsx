const ReportTable = ({ data }) => {
    return (
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 text-left">Developer</th>
            <th className="p-2 text-left">Completed Tasks</th>
            <th className="p-2 text-left">Pending Tasks</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="border-b">
              <td className="p-2">{row.developer}</td>
              <td className="p-2">{row.completedTasks}</td>
              <td className="p-2">{row.pendingTasks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };
  
  export default ReportTable;