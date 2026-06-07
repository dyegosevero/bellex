import { InactiveClientsAlert } from "@/components/dashboard/InactiveClientsAlert";
import { FullCalendarAgenda } from "@/components/agenda/FullCalendarAgenda";

const Dashboard = () => {
  return (
    <div>
      <InactiveClientsAlert />
      <FullCalendarAgenda />
    </div>
  );
};

export default Dashboard;
