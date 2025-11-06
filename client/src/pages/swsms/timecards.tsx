import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Plus, QrCode, Calendar, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, startOfWeek, endOfWeek, parseISO, isSameWeek, addDays } from "date-fns";
import { z } from "zod";

// Time slot schema
const timeSlotSchema = z.object({
  timeIn: z.string(),
  timeOut: z.string(),
  task: z.string(),
  hours: z.number().min(0).max(24),
});

// Weekly timecard schema with 3 slots per day
const weeklyTimecardSchema = z.object({
  applicationId: z.string().min(1, "Please select a position"),
  weekStartDate: z.string(),
  days: z.object({
    sunday: z.object({
      slots: z.array(timeSlotSchema).length(3)
    }),
    monday: z.object({
      slots: z.array(timeSlotSchema).length(3)
    }),
    tuesday: z.object({
      slots: z.array(timeSlotSchema).length(3)
    }),
    wednesday: z.object({
      slots: z.array(timeSlotSchema).length(3)
    }),
    thursday: z.object({
      slots: z.array(timeSlotSchema).length(3)
    }),
    friday: z.object({
      slots: z.array(timeSlotSchema).length(3)
    }),
    saturday: z.object({
      slots: z.array(timeSlotSchema).length(3)
    }),
  }),
});

export default function TimecardsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(25);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: timecards, isLoading } = useQuery({
    queryKey: ["/api/swsms/timecards"],
  });

  const { data: applications } = useQuery({
    queryKey: ["/api/swsms/applications"],
  });

  const timecardsArray = Array.isArray(timecards)
    ? timecards
    : (timecards as any)?.timeCards || [];

  const approvedApps = Array.isArray(applications)
    ? applications.filter((app: any) => app.status === "approved")
    : (applications as any)?.applications?.filter((app: any) => app.status === "approved") || [];

  // Get current week start (Sunday)
  const getCurrentWeekStart = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    return weekStart.toISOString().split('T')[0];
  };

  // Calculate hours between two times
  const calculateHours = (timeIn: string, timeOut: string): number => {
    if (!timeIn || !timeOut) return 0;

    const [inHour, inMin] = timeIn.split(':').map(Number);
    const [outHour, outMin] = timeOut.split(':').map(Number);

    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;

    let diff = outMinutes - inMinutes;
    if (diff < 0) diff += 24 * 60; // Handle overnight shifts

    return Math.round((diff / 60) * 10) / 10; // Round to 1 decimal
  };

  const emptySlot = { timeIn: "", timeOut: "", task: "", hours: 0 };

  const form = useForm({
    resolver: zodResolver(weeklyTimecardSchema),
    defaultValues: {
      applicationId: "",
      weekStartDate: getCurrentWeekStart(),
      days: {
        sunday: { slots: [emptySlot, emptySlot, emptySlot] },
        monday: { slots: [emptySlot, emptySlot, emptySlot] },
        tuesday: { slots: [emptySlot, emptySlot, emptySlot] },
        wednesday: { slots: [emptySlot, emptySlot, emptySlot] },
        thursday: { slots: [emptySlot, emptySlot, emptySlot] },
        friday: { slots: [emptySlot, emptySlot, emptySlot] },
        saturday: { slots: [emptySlot, emptySlot, emptySlot] },
      },
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Submit individual timecards for each slot with hours > 0
      const promises: Promise<any>[] = [];
      const weekStart = new Date(data.weekStartDate);

      const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

      dayOrder.forEach((day, dayIndex) => {
        const dayData = data.days[day];

        dayData.slots.forEach((slot: any) => {
          if (slot.hours > 0 && slot.timeIn && slot.timeOut) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + dayIndex);

            promises.push(
              apiRequest("POST", "/api/swsms/timecards", {
                applicationId: data.applicationId,
                date: dayDate.toISOString(),
                hoursWorked: slot.hours.toString(),
                taskDescription: slot.task || "Work performed",
              })
            );
          }
        });
      });

      const results = await Promise.all(promises);
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swsms/timecards"] });
      toast({
        title: "Weekly timecard submitted",
        description: "Your work hours have been logged successfully",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      // Only show error if the submission actually failed
      console.error("Timecard submission error:", error);
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit timecards",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    // Calculate total hours from all slots
    let totalHours = 0;
    Object.values(data.days).forEach((day: any) => {
      day.slots.forEach((slot: any) => {
        totalHours += slot.hours || 0;
      });
    });

    if (totalHours === 0) {
      toast({
        title: "No hours entered",
        description: "Please enter time in/out for at least one slot",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(data);
  };

  // Group timecards by week
  const filteredTimecards = useMemo(() => {
    if (statusFilter === 'all') return timecardsArray;
    return timecardsArray.filter((tc: any) => tc.status === statusFilter);
  }, [timecardsArray, statusFilter]);

  const groupedByWeek = useMemo(() => {
    const groups: { [key: string]: any[] } = {};

    filteredTimecards.forEach((card: any) => {
      const cardDate = parseISO(card.date);
      const weekStart = startOfWeek(cardDate, { weekStartsOn: 0 }); // Sunday
      const weekEnd = endOfWeek(cardDate, { weekStartsOn: 0 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      const weekLabel = `${format(weekStart, 'MMM dd, yyyy')} - ${format(weekEnd, 'MMM dd, yyyy')}`;

      if (!groups[weekKey]) {
        groups[weekKey] = [];
      }

      groups[weekKey].push({ ...card, weekLabel });
    });

    // Sort weeks by date (most recent first)
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([weekKey, cards]) => ({
        weekKey,
        weekLabel: cards[0].weekLabel,
        cards: cards.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        totalHours: cards.filter(c => c.status === 'verified').reduce((sum, card) => sum + parseFloat(card.hoursWorked || 0), 0),
        totalEarnings: cards.filter(c => c.status === 'verified').reduce((sum, card) => sum + parseFloat(card.earnings || 0), 0),
      }));
  }, [filteredTimecards]);

  // Pagination
  const totalPages = Math.ceil(groupedByWeek.length / recordsPerPage);
  const paginatedWeeks = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return groupedByWeek.slice(startIndex, endIndex);
  }, [groupedByWeek, currentPage, recordsPerPage]);

  // Reset to page 1 when changing records per page
  const handleRecordsPerPageChange = (value: string) => {
    setRecordsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/work-study")}
            className="h-8 w-8 md:h-10 md:w-10"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">Timecards</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">
              Log your work hours and track verification status
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-ueab-blue hover:bg-ueab-blue-light text-sm md:text-base" data-testid="button-log-hours">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Log Weekly Hours</span>
              <span className="sm:hidden">Log Hours</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] md:max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Weekly Timecard</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="applicationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Position</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-application">
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {approvedApps.map((app: any) => (
                              <SelectItem key={app.id} value={app.id}>
                                {app.position} - {app.department}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weekStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Week Period</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          {field.value && (
                            <>
                              {format(parseISO(field.value), 'MMMM d, yyyy')} - {' '}
                              {format(addDays(parseISO(field.value), 6), 'MMMM d, yyyy')}
                            </>
                          )}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Mobile scroll hint */}
                <div className="md:hidden bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
                  💡 Tip: Scroll horizontally to see all columns
                </div>

                {/* Weekly Hours Table */}
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-xs md:text-sm min-w-[800px]">
                    <thead className="bg-ueab-blue/10">
                      <tr>
                        <th className="px-2 md:px-3 py-2 text-left font-semibold">Day</th>
                        <th className="px-2 md:px-3 py-2 text-left font-semibold">Slot</th>
                        <th className="px-2 md:px-3 py-2 text-center font-semibold">Time In</th>
                        <th className="px-2 md:px-3 py-2 text-center font-semibold">Time Out</th>
                        <th className="px-2 md:px-3 py-2 text-center font-semibold">Hours</th>
                        <th className="px-2 md:px-3 py-2 text-left font-semibold">Task</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day, dayIndex) => (
                        <>
                          {[0, 1, 2].map((slotIndex) => (
                            <tr key={`${day}-${slotIndex}`} className="border-t hover:bg-muted/5">
                              {slotIndex === 0 && (
                                <td rowSpan={3} className="px-2 md:px-3 py-2 md:py-3 font-medium capitalize border-r align-top text-xs md:text-sm">
                                  {day}
                                </td>
                              )}
                              <td className="px-2 md:px-3 py-2 text-center text-muted-foreground text-xs md:text-sm">{slotIndex + 1}</td>

                              {/* Time In */}
                              <td className="px-2 md:px-3 py-2">
                                <FormField
                                  control={form.control}
                                  name={`days.${day}.slots.${slotIndex}.timeIn` as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          type="time"
                                          className="w-20 md:w-28 text-xs md:text-sm"
                                          onChange={(e) => {
                                            field.onChange(e.target.value);
                                            const timeOut = form.getValues(`days.${day}.slots.${slotIndex}.timeOut` as any);
                                            if (e.target.value && timeOut) {
                                              const hours = calculateHours(e.target.value, timeOut);
                                              form.setValue(`days.${day}.slots.${slotIndex}.hours` as any, hours);
                                            }
                                          }}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </td>

                              {/* Time Out */}
                              <td className="px-2 md:px-3 py-2">
                                <FormField
                                  control={form.control}
                                  name={`days.${day}.slots.${slotIndex}.timeOut` as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          type="time"
                                          className="w-20 md:w-28 text-xs md:text-sm"
                                          onChange={(e) => {
                                            field.onChange(e.target.value);
                                            const timeIn = form.getValues(`days.${day}.slots.${slotIndex}.timeIn` as any);
                                            if (timeIn && e.target.value) {
                                              const hours = calculateHours(timeIn, e.target.value);
                                              form.setValue(`days.${day}.slots.${slotIndex}.hours` as any, hours);
                                            }
                                          }}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </td>

                              {/* Hours (auto-calculated) */}
                              <td className="px-2 md:px-3 py-2 text-center">
                                <div className="font-semibold text-ueab-blue text-xs md:text-sm">
                                  {form.watch(`days.${day}.slots.${slotIndex}.hours` as any)?.toFixed(1) || '0.0'}
                                </div>
                              </td>

                              {/* Task Description */}
                              <td className="px-2 md:px-3 py-2">
                                <FormField
                                  control={form.control}
                                  name={`days.${day}.slots.${slotIndex}.task` as any}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="Task..."
                                          className="w-full min-w-[100px] text-xs md:text-sm"
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </td>
                            </tr>
                          ))}
                        </>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/20 border-t-2">
                      <tr>
                        <td colSpan={4} className="px-2 md:px-3 py-2 md:py-3 text-right font-bold text-xs md:text-sm">Total Hours</td>
                        <td className="px-2 md:px-3 py-2 md:py-3 text-center font-bold text-ueab-blue text-base md:text-lg">
                          {(() => {
                            let total = 0;
                            Object.values(form.watch('days') || {}).forEach((day: any) => {
                              day?.slots?.forEach((slot: any) => {
                                total += slot?.hours || 0;
                              });
                            });
                            return total.toFixed(1);
                          })()}
                        </td>
                        <td className="px-2 md:px-3 py-2 md:py-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-ueab-blue hover:bg-ueab-blue-light"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-timecard"
                  >
                    Submit Weekly Timecard
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : timecardsArray.length > 0 ? (
        <div className="space-y-6">
          {/* Pagination Controls - Top */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show</span>
                  <Select value={recordsPerPage.toString()} onValueChange={handleRecordsPerPageChange}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">weeks per page</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="space-x-2">
                    <Button variant={statusFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('all')}>All</Button>
                    <Button variant={statusFilter === 'pending' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('pending')}>Pending</Button>
                    <Button variant={statusFilter === 'verified' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('verified')}>Verified</Button>
                    <Button variant={statusFilter === 'rejected' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('rejected')}>Rejected</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Week Groups */}
          {paginatedWeeks.map((week) => (
            <Card key={week.weekKey}>
              <CardHeader className="bg-ueab-blue/5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <CardTitle className="text-lg text-ueab-blue flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Week of {week.weekLabel}
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2 text-sm">
                    <Badge variant="outline" className="bg-background">
                      Total: {week.totalHours.toFixed(1)} hours
                    </Badge>
                    {week.totalEarnings > 0 && (
                      <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4">
                        KSh {week.totalEarnings.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Position</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Hours</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Task</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Earnings</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">QR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {week.cards.map((card: any, idx: number) => (
                        <tr
                          key={card.id}
                          className={`border-b hover:bg-muted/50 transition-colors ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                            }`}
                          data-testid={`timecard-${card.id}`}
                        >
                          <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                            {format(new Date(card.date), "EEE, MMM dd")}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {card.application?.position || "---"}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground">
                            {parseFloat(card.hoursWorked).toFixed(1)} hrs
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                            {card.taskDescription}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={
                                card.status === 'verified'
                                  ? 'bg-chart-4/20 text-chart-4'
                                  : card.status === 'pending'
                                    ? 'bg-chart-5/20 text-chart-5'
                                    : 'bg-destructive/20 text-destructive'
                              }
                            >
                              {card.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {card.status === "verified" && card.earnings ? (
                              <span className="font-semibold text-chart-4">
                                KSh {parseFloat(card.earnings).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                {card.status === "pending" ? "Pending" : "---"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {card.qrCode && (
                              <QrCode className="h-5 w-5 text-ueab-blue inline-block" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination Controls - Bottom */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, groupedByWeek.length)} of {groupedByWeek.length} weeks
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    {currentPage} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No timecards yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Start logging your work hours
            </p>
            {approvedApps.length > 0 ? (
              <Button
                className="bg-ueab-blue hover:bg-ueab-blue-light"
                onClick={() => setDialogOpen(true)}
                data-testid="button-get-started-timecards"
              >
                Log Hours
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                You need an approved work application first
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
