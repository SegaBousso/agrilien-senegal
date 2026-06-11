import { Badge } from '@/components/ui/Badge';
import {
  LISTING_STATUS_LABELS,
  LISTING_STATUS_STYLES,
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_STYLES,
} from '@/lib/constants';
import type { ListingStatus, RequestStatus } from '@/types/database';

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  return <Badge className={LISTING_STATUS_STYLES[status]}>{LISTING_STATUS_LABELS[status]}</Badge>;
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Badge className={REQUEST_STATUS_STYLES[status]}>{REQUEST_STATUS_LABELS[status]}</Badge>;
}
