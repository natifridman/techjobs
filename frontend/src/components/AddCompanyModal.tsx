import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, ExternalLink, ArrowLeft, CheckCircle2 } from 'lucide-react';

const CATEGORIES = [
  { id: 1, name: 'AI/ML' },
  { id: 2, name: 'AdTech' },
  { id: 3, name: 'Aerospace' },
  { id: 4, name: 'AR/VR' },
  { id: 5, name: 'Automotive' },
  { id: 6, name: 'Cloud Computing' },
  { id: 7, name: 'Cybersecurity' },
  { id: 8, name: 'Digital Media' },
  { id: 9, name: 'E-commerce & Retail' },
  { id: 10, name: 'Fintech' },
  { id: 11, name: 'Gaming' },
  { id: 12, name: 'Health' },
  { id: 13, name: 'IoT' },
  { id: 14, name: 'Productivity' },
  { id: 15, name: 'Robotics & Automation' },
  { id: 16, name: 'Semiconductors' },
  { id: 17, name: 'Sustainable Technology' },
  { id: 18, name: 'Telecommunications' },
];

const SIZES = [
  { value: 'xs', label: '1-10' },
  { value: 's', label: '11-50' },
  { value: 'm', label: '51-200' },
  { value: 'l', label: '201-1,000' },
  { value: 'xl', label: '1,001+' },
];

interface AddCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const emptyForm = {
  name: '',
  description: '',
  categoryId: '',
  size: '',
  websiteUrl: '',
  careersUrl: '',
  city: '',
  street: '',
  houseNumber: '',
  companyNumber: '',
};
type Field = keyof typeof emptyForm;
const fieldNames: Record<Field, string> = {
  name: 'Company name',
  description: 'Short description',
  categoryId: 'Industry',
  size: 'Company size',
  websiteUrl: 'Website URL',
  careersUrl: 'Careers URL',
  city: 'City or location',
  street: 'Street',
  houseNumber: 'Number',
  companyNumber: 'Company registration number (ח.פ)',
};
export default function AddCompanyModal({ open, onOpenChange }: AddCompanyModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [review, setReview] = useState(false);
  const reviewTitleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (review && open) reviewTitleRef.current?.focus();
  }, [review, open]);
  const required: Field[] = ['name', 'companyNumber', 'categoryId', 'size', 'city', 'careersUrl'];
  const set = (key: Field, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: '' }));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    for (const key of required) if (!form[key].trim()) next[key] = `${fieldNames[key]} is required.`;
    for (const key of ['websiteUrl', 'careersUrl'] as const)
      if (form[key].trim()) {
        try {
          if (!['http:', 'https:'].includes(new URL(form[key]).protocol)) throw new Error();
        } catch {
          next[key] = 'Enter a complete website address beginning with https:// or http://.';
        }
      }
    if (form.categoryId && !CATEGORIES.some((category) => String(category.id) === form.categoryId))
      next.categoryId = 'Choose an industry from the list.';
    if (form.size && !SIZES.some((size) => size.value === form.size))
      next.size = 'Choose a company size from the list.';
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }
    setReview(true);
  };
  const payload = {
    name: form.name.trim(),
    description: form.description.trim(),
    categoryId: Number(form.categoryId),
    size: form.size,
    websiteUrl: form.websiteUrl.trim(),
    careersUrl: form.careersUrl.trim(),
    addresses: [
      {
        city: form.city.trim(),
        ...(form.street.trim() ? { street: form.street.trim() } : {}),
        ...(form.houseNumber.trim() ? { houseNumber: form.houseNumber.trim() } : {}),
      },
    ],
    isMultinational: false,
    isActive: true,
  };
  const base = (
    (import.meta.env.VITE_SUBMIT_COMPANY_URL as string) || 'https://github.com/natifridman/techjobs'
  ).replace(/\/+$/, '');
  const issueUrl = `${base}/issues/new?title=${encodeURIComponent(`Add company: ${form.name.trim()} (${form.companyNumber.trim()})`)}&body=${encodeURIComponent(`Company registration number: ${form.companyNumber.trim()}\n\n` + '```json\n' + JSON.stringify(payload, null, 2) + '\n```')}`;
  const field = (key: Field, type: 'text' | 'url' = 'text', placeholder = '') => (
    <div>
      <label htmlFor={key} className="mb-1.5 block text-sm font-medium text-ink">
        {fieldNames[key]}
        {required.includes(key) ? (
          ' *'
        ) : (
          <span className="ml-1 text-xs font-normal text-muted">optional</span>
        )}
      </label>
      <Input
        id={key}
        type={type}
        inputMode={key === 'companyNumber' ? 'numeric' : undefined}
        required={required.includes(key)}
        value={form[key]}
        onChange={(event) => set(key, event.target.value)}
        placeholder={placeholder}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
      />
      {errors[key] && (
        <p id={`${key}-error`} role="alert" className="mt-1.5 text-sm text-danger">
          {errors[key]}
        </p>
      )}
    </div>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
            Suggest a company
          </DialogTitle>
          <DialogDescription>
            {review
              ? 'Check the details before continuing to GitHub.'
              : 'Help others discover a hiring team. Fields marked * are required.'}
          </DialogDescription>
        </DialogHeader>
        {!review ? (
          <form onSubmit={submit} noValidate className="mt-2 space-y-5">
            {field('name', 'text', 'Company name')}
            {field('companyNumber', 'text', 'e.g. 513674309')}
            {field('description', 'text', 'What does this team do?')}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="categoryId" className="mb-1.5 block text-sm font-medium text-ink">
                  Industry *
                </label>
                <select
                  id="categoryId"
                  className="native-select"
                  value={form.categoryId}
                  onChange={(event) => set('categoryId', event.target.value)}
                  aria-invalid={!!errors.categoryId}
                  aria-describedby={errors.categoryId ? 'categoryId-error' : undefined}
                  required
                >
                  <option value="">Choose an industry</option>
                  {CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p id="categoryId-error" role="alert" className="mt-1.5 text-sm text-danger">
                    {errors.categoryId}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="size" className="mb-1.5 block text-sm font-medium text-ink">
                  Company size *
                </label>
                <select
                  id="size"
                  className="native-select"
                  value={form.size}
                  onChange={(event) => set('size', event.target.value)}
                  aria-invalid={!!errors.size}
                  aria-describedby={errors.size ? 'size-error' : undefined}
                  required
                >
                  <option value="">Choose a size</option>
                  {SIZES.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label} employees
                    </option>
                  ))}
                </select>
                {errors.size && (
                  <p id="size-error" role="alert" className="mt-1.5 text-sm text-danger">
                    {errors.size}
                  </p>
                )}
              </div>
            </div>
            {field('careersUrl', 'url', 'https://company.com/careers')}
            {field('websiteUrl', 'url', 'https://company.com')}
            {field('city', 'text', 'e.g. Tel Aviv')}
            <details className="rounded-lg border border-border p-3">
              <summary className="min-h-8 cursor-pointer text-sm font-medium text-muted">
                Street address (optional)
              </summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-[2fr_1fr]">
                {field('street')}
                {field('houseNumber')}
              </div>
            </details>
            <Button type="submit" className="w-full">
              Review suggestion
            </Button>
            <p className="text-center text-xs leading-5 text-muted">
              The next step opens a prefilled issue on GitHub for maintainers to review.
            </p>
          </form>
        ) : (
          <div className="mt-2 space-y-5">
            <div className="rounded-xl border border-border bg-page p-5">
              <div className="mb-4 flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                <h3 ref={reviewTitleRef} tabIndex={-1} className="break-words text-lg font-semibold">
                  {form.name}
                </h3>
              </div>
              <dl className="space-y-3 text-sm">
                {(
                  [
                    'companyNumber',
                    'description',
                    'categoryId',
                    'size',
                    'careersUrl',
                    'websiteUrl',
                    'city',
                    'street',
                    'houseNumber',
                  ] as Field[]
                )
                  .filter((key) => form[key])
                  .map((key) => (
                    <div key={key}>
                      <dt className="font-medium text-muted">{fieldNames[key]}</dt>
                      <dd className="mt-1 break-words text-ink" dir="auto">
                        {key === 'categoryId'
                          ? CATEGORIES.find((category) => String(category.id) === form.categoryId)?.name
                          : key === 'size'
                            ? `${SIZES.find((size) => size.value === form.size)?.label} employees`
                            : form[key]}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
            <p className="text-sm leading-6 text-muted">
              These company details will be included in a public GitHub issue. You may need a GitHub account.
              Submit the issue on GitHub to finish your suggestion.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setReview(false)} className="gap-2 sm:flex-1">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Edit details
              </Button>
              <Button asChild className="gap-2 sm:flex-1">
                <a href={issueUrl} target="_blank" rel="noopener noreferrer">
                  Continue on GitHub
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
