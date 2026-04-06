import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Banknote, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitSalaryReport, type SalaryReportInput } from '@/api/salaries';
import { toast } from 'sonner';

interface SalaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillCompany?: string;
  prefillTitle?: string;
}

const EXPERIENCE_OPTIONS = [
  { value: '0', label: '0-1 years' },
  { value: '2', label: '2-3 years' },
  { value: '4', label: '4-5 years' },
  { value: '6', label: '6-8 years' },
  { value: '9', label: '9-12 years' },
  { value: '13', label: '13+ years' },
];

const LOCATIONS = [
  'Tel Aviv',
  'Herzliya',
  'Ramat Gan',
  'Petah Tikva',
  'Haifa',
  'Jerusalem',
  'Beer Sheva',
  'Netanya',
  'Remote',
  'Other',
];

export default function SalaryReportModal({ 
  isOpen, 
  onClose, 
  prefillCompany = '', 
  prefillTitle = '' 
}: SalaryReportModalProps) {
  const [formData, setFormData] = useState<SalaryReportInput>({
    company_name: prefillCompany,
    job_title: prefillTitle,
    base_salary: 0,
    experience_years: undefined,
    location: 'Tel Aviv',
    total_compensation: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name || !formData.job_title || !formData.base_salary) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.base_salary < 5000 || formData.base_salary > 200000) {
      toast.error('Salary must be between ₪5,000 and ₪200,000 per month');
      return;
    }

    setIsSubmitting(true);
    
    const result = await submitSalaryReport(formData);
    
    setIsSubmitting(false);

    if (result.success) {
      setSubmitted(true);
      toast.success('Thank you for contributing! Your report will be reviewed.');
    } else {
      toast.error(result.error || 'Failed to submit report');
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setFormData({
      company_name: '',
      job_title: '',
      base_salary: 0,
      experience_years: undefined,
      location: 'Tel Aviv',
      total_compensation: undefined,
    });
    onClose();
  };

  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-warm-900 mb-2">
              Thank You! 🙏
            </h3>
            <p className="text-warm-600 mb-6">
              Your report has been submitted and will be reviewed.
              <br />
              This data will help others get accurate salary information.
            </p>
            <Button onClick={handleClose} className="bg-iris-600 hover:bg-iris-700">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Banknote className="w-6 h-6 text-emerald-600" />
            Report Your Salary
          </DialogTitle>
          <DialogDescription>
            Help others get accurate salary information for Israeli tech.
            <br />
            Your report is completely anonymous.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Privacy notice */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Anonymous submission. We don't store any identifying information.</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company"
                placeholder="e.g. Google, Wix"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </div>

            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Job Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Senior Software Engineer"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Base Salary */}
            <div className="space-y-2">
              <Label htmlFor="salary">
                Monthly Base Salary (₪) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="salary"
                type="number"
                placeholder="e.g. 35000"
                min={5000}
                max={200000}
                value={formData.base_salary || ''}
                onChange={(e) => setFormData({ ...formData, base_salary: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            {/* Total Compensation */}
            <div className="space-y-2">
              <Label htmlFor="total">
                Total Compensation (optional)
              </Label>
              <Input
                id="total"
                type="number"
                placeholder="Including bonuses, equity"
                value={formData.total_compensation || ''}
                onChange={(e) => setFormData({ ...formData, total_compensation: parseInt(e.target.value) || undefined })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Experience */}
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Select
                value={formData.experience_years?.toString()}
                onValueChange={(v) => setFormData({ ...formData, experience_years: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location}
                onValueChange={(v) => setFormData({ ...formData, location: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Please report accurate data only. False reports will be removed.</span>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
