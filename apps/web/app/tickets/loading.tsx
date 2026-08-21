import { PageSkeleton } from "../../components/page-skeleton";
import { Shell } from "../../components/shell";

export default function LoadingTickets() { return <Shell><PageSkeleton rows={4}/></Shell>; }
