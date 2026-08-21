import { PageSkeleton } from "../../../components/page-skeleton";
import { Shell } from "../../../components/shell";

export default function LoadingTicket() { return <Shell><PageSkeleton rows={3}/></Shell>; }
