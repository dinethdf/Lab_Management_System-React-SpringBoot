// Barrel export file for all common LabCare UI components
export { Button } from './Button';
export { Badge } from './Badge';
export { DataTable } from './DataTable';
export { ContentCard } from './ContentCard';
export { StatCard } from './StatCard';
export { QuickActionCard } from './QuickActionCard';

// Phase 1: Form Inputs & Feedback
export { FormInput } from './FormInput';
export { FormSelect } from './FormSelect';
export { FormTextarea } from './FormTextarea';
export { LoadingSpinner } from './LoadingSpinner';
export { ErrorAlert } from './ErrorAlert';
export { SuccessAlert } from './SuccessAlert';
export { EmptyState } from './EmptyState';

// Phase 2: Layout Containers & Dialogs
export { Modal } from './Modal';
export { ConfirmDialog } from './ConfirmDialog';
export { PageHeader } from './PageHeader';
export { StepWizard } from './StepWizard';

// Phase 3: Lab-Specific Display
export { SampleStatusBadge } from './SampleStatusBadge';
export { ResultValueCell } from './ResultValueCell';
export { PatientInfoCard } from './PatientInfoCard';

// Phase 4: Complex & Scanner Interaction
export { AutoCompleteSearch } from './AutoCompleteSearch';
export { TestCheckboxList } from './TestCheckboxList';
export { BarcodeInput } from './BarcodeInput';
export { AgeRangeInput } from './AgeRangeInput';

// Global Upper-Right Toast Notification System
export { ToastContainer, ToastItem } from './Toast';
export { useToast } from '../../context/ToastContext';

