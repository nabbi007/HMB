import {
  Add,
  ArrowDown2,
  ArrowLeft,
  ArrowRight,
  Calendar,
  ClipboardTick,
  CloseCircle,
  Danger,
  DocumentUpload,
  Eye,
  EyeSlash,
  Heart,
  Home,
  Logout,
  Message,
  Moon,
  Notification,
  Profile2User,
  SearchNormal1,
  Send2,
  Setting4,
  Star,
  Sun1,
  TickCircle,
  Trash,
  Verify,
  Wallet,
  type Icon as IconsaxIcon,
} from "iconsax-react"
import type { FC, SVGProps } from "react"

// Centralizes our icon choices behind one module so the whole app reads from a
// single, consistent set — every icon here is iconsax's "Bold" (filled) variant.
// Swapping icon libraries or styles again only means editing this file.
//
// `color` is set explicitly (not left to iconsax's own default) because iconsax-react
// falls back to "currentColor" via `Icon.defaultProps`, and React 19 dropped support
// for defaultProps on function components — it's now a silent no-op, so without this
// every icon renders with an unset fill and is invisible.
function bold(Icon: IconsaxIcon): FC<SVGProps<SVGSVGElement>> {
  return function BoldIcon(props) {
    return <Icon color="currentColor" variant="Bold" {...props} />
  }
}

export const HomeIcon = bold(Home)
export const CalendarIcon = bold(Calendar)
export const MessageIcon = bold(Message)
export const NotificationIcon = bold(Notification)
export const MoonIcon = bold(Moon)
export const SunIcon = bold(Sun1)
export const SearchIcon = bold(SearchNormal1)
export const FilterIcon = bold(Setting4)
export const CloseIcon = bold(CloseCircle)
export const BackIcon = bold(ArrowLeft)
export const SendIcon = bold(Send2)
export const VerifiedIcon = bold(Verify)
export const CheckCircleIcon = bold(TickCircle)
export const WarningIcon = bold(Danger)
export const LogoutIcon = bold(Logout)
export const ArrowRightIcon = bold(ArrowRight)
export const HeartIcon = bold(Heart)
export const CaregiverIcon = bold(Profile2User)
export const RequestsIcon = bold(ClipboardTick)
export const WalletIcon = bold(Wallet)
export const UploadIcon = bold(DocumentUpload)
export const AddIcon = bold(Add)
export const TrashIcon = bold(Trash)
export const StarIcon = bold(Star)
export const ChevronDownIcon = bold(ArrowDown2)
export const EyeIcon = bold(Eye)
export const EyeSlashIcon = bold(EyeSlash)
