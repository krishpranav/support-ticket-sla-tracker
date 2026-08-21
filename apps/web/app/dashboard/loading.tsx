import { PageSkeleton } from "../../components/page-skeleton";
import { Shell } from "../../components/shell";

export default function LoadingDashboard() { return <Shell><PageSkeleton rows={6}/></Shell>; }
