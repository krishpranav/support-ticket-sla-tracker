import { PageSkeleton } from "../../components/page-skeleton";
import { Shell } from "../../components/shell";

export default function LoadingHolidays() { return <Shell><PageSkeleton rows={2}/></Shell>; }
