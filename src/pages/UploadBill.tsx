import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/lib/supabaseClient';
import imageCompression from "browser-image-compression";

type BillType = 'income' | 'expense';

interface FormValues {
  title: string;
  amount: number;
  due : number;
  type: BillType;
  note: string;
  date: Date;
  file?: FileList;
}

// Helper: Compress image roughly 10x smaller
async function compressImage(file: File): Promise<File> {
  if (file.size < 1 * 1024 * 1024) return file; // skip small files

  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.7,
  };
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Image compression failed:", error);
    return file; // fallback to original if error
  }
}

const UploadBill = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue, 
    reset, 
    formState: { errors } 
  } = useForm<FormValues>({
    defaultValues: {
      title: '',
      amount: 0,
      due:0,
      type: 'income', // Changed default to income
      note: '',
      date: new Date(),
    }
  });

  const selectedDate = watch('date');
  const selectedType = watch('type');
  const selectedFile = watch('file')?.[0];

  // Preview selected file if it's an image
  React.useEffect(() => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  }, [selectedFile]);

  const month = new Date().toLocaleString('default', { month: 'long' }); // e.g. "May"

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    let uploadedFileUrl = null;

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        toast({ title: "Unauthorized", description: "You must be logged in", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      const { data: userData, error: creditError } = await supabase
      .from("users")
      .select("credit")
      .eq("id", user.id)
      .single();

      if (creditError || !userData || userData.credit <= 0) {
        toast({
          title: "Insufficient Credits",
          description: "You need credits to save a transaction.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const amountNumber = parseFloat(data.amount.toString());
       const dueNumber = parseFloat(data.due.toString());
      if (isNaN(amountNumber) || amountNumber <= 0) {
        toast({ title: "Invalid Amount", description: "Enter valid amount", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      if (!data.title.trim()) {
        toast({ title: "Missing Title", description: "Enter transaction title", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      // Handle file upload if exists
      if (data.file && data.file.length > 0) {
        let file = data.file[0];

        if (file.type.startsWith("image/")) {
          // Compress image before upload
          file = await compressImage(file);
        }

       
        // PDFs uploaded as-is; no compression here

        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${month}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('userbill')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase
          .storage
          .from('userbill')
          .getPublicUrl(filePath);

        uploadedFileUrl = urlData.publicUrl;
      }

      const formattedDateTime = data.date.toISOString();

      // Insert transaction into database
      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          title: data.title.trim(),
          amount: amountNumber,
          due:dueNumber,
          type: data.type,
          description: data.note,
          date: formattedDateTime,
          bill_url: uploadedFileUrl
        }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `${data.type === 'income' ? 'Income' : 'Expense'} of ₹${amountNumber.toFixed(2)} added.`
      });

      reset({
        title: '',
        amount: 0,
        type: 'income',
        note: '',
        date: new Date(),
      });
      setFilePreview(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom file input handler with drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = e.dataTransfer.files;
      // Create a new DataTransfer object
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(fileList[0]);
      
      // Set the file input value
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) {
        fileInput.files = dataTransfer.files;
        // Trigger change event to update react-hook-form
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    }
  };
  

  return (
    <div className="w-full px-4 pb-16">
      <Card className="shadow-lg max-w-6xl mx-auto">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-2xl">Add New Transaction</CardTitle>
          <CardDescription>Fill the form to add a transaction</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base">Transaction Title *</Label>
                  <Input 
                    id="title" 
                    type="text" 
                    placeholder="Enter title" 
                    className="h-12 text-base"
                    {...register("title", { required: "Required" })} 
                  />
                  {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-base">Amount (₹) *</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    placeholder="0.00" 
                    className="h-12 text-base"
                    {...register("amount", {
                      required: "Required",
                      min: { value: 0.01, message: "Amount must be > 0" }
                    })} 
                  />
                  {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 text-base", 
                          !selectedDate && "text-muted-foreground"
                        )}
                      >  
                        <CalendarIcon className="mr-2 h-5 w-5" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => setValue("date", date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-base">Transaction Type *</Label>
                  <RadioGroup
                    value={selectedType}
                    onValueChange={(value) => setValue('type', value as BillType)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className={`flex items-center space-x-2 px-4 py-4 rounded-md border ${
                      selectedType === 'income' 
                        ? 'bg-green-50 border-green-500 ring-2 ring-green-200' 
                        : 'bg-gray-50'
                    }`}>
                      <RadioGroupItem value="income" id="income" className="h-5 w-5" />
                      <Label htmlFor="income" className="font-medium text-base">Income</Label>
                    </div>
                    <div className={`flex items-center space-x-2 px-4 py-4 rounded-md border ${
                      selectedType === 'expense' 
                        ? 'bg-red-50 border-red-500 ring-2 ring-red-200' 
                        : 'bg-gray-50'
                    }`}>
                      <RadioGroupItem value="expense" id="expense" className="h-5 w-5" />
                      <Label htmlFor="expense" className="font-medium text-base">Expense</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              
              {/* Right column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-base">Due (₹) *</Label>
                  <Input 
                    id="due" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    placeholder="0.00" 
                    className="h-12 text-base"
                    {...register("due", {
                      required: "Required",
                      min: { value: 0, message: "Due must be ≥ 0" }
                    })}
                  />
                </div>

                <div>
                  <Label className="text-base mb-2 block">Upload Bill (Image or PDF)</Label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file')?.click()}
                  >
                    <input
                      id="file"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      {...register("file")}
                    />
                    
                    {filePreview || (selectedFile && !selectedFile.type.startsWith('image/')) ? (
                      <div className="space-y-3">
                        {filePreview ? (
                          <div className="mx-auto max-h-48 overflow-hidden rounded border">
                            <img 
                              src={filePreview} 
                              alt="Preview" 
                              className="h-auto w-auto max-w-full max-h-48 mx-auto" 
                            />
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-100 rounded">
                            <svg className="w-12 h-12 mx-auto text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            const input = document.getElementById('file') as HTMLInputElement;
                            if (input) input.value = '';
                            setValue('file', undefined as any);
                            setFilePreview(null);
                          }}
                        >
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <div className="flex text-sm text-gray-600 justify-center">
                          <span className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                            Upload a file
                          </span>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, or PDF up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note" className="text-base">Description (Optional)</Label>
                  <Textarea 
                    id="note" 
                    placeholder="Add details about this transaction" 
                    className="min-h-32 text-base"
                    {...register("note")} 
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-6 text-lg font-medium mt-8" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Transaction"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadBill;



