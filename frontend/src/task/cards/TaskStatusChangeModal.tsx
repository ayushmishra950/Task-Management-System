import React, { useEffect, useState } from "react";
import { SubTask, Status } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const REASON_MAX_LENGTH = 500;

interface TaskStatusChangeModalProps {
  task: SubTask;
  onClose: () => void;
  /** Reason optional hai - khaali ho to empty string aata hai */
  onConfirm: (reason: string) => void;
  newStatus: Status;
  setNewStatus: (value : string) => void;
  isOpen?: boolean;
  name : string;
}

const TaskStatusChangeModal: React.FC<TaskStatusChangeModalProps> = ({
  name,
  task,
  onClose,
  onConfirm,
  newStatus,
  setNewStatus,
  isOpen = true,
}) => {
  const [reason, setReason] = useState("");

  useEffect(()=>{
    if(task?.status){
      setNewStatus(task?.status)
    }
  },[task, setNewStatus])

  // Har baar modal khulne par reason khaali se shuru ho
  useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen, task]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className=" w-[95vw] max-w-[95vw] sm:max-w-[425px] p-4 sm:p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle>Update {name} Status</DialogTitle>
          <DialogDescription>
            Change the status of <span className="font-medium text-foreground">{task?.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="status" className="text-right sr-only">
              New Status
            </Label>
            <Select
              value={newStatus}
              onValueChange={(value) => setNewStatus(value as Status)}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending" className="cursor-pointer">Pending</SelectItem>
                <SelectItem value="in_progress" className="cursor-pointer">In Progress</SelectItem>
                <SelectItem value="completed" className="cursor-pointer">Completed</SelectItem>
                <SelectItem value="cancelled" className="cursor-pointer">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="status-reason">
              Reason <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="status-reason"
              rows={3}
              maxLength={REASON_MAX_LENGTH}
              placeholder="Why is the status being changed?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-xs text-muted-foreground text-right">
              {reason.length}/{REASON_MAX_LENGTH}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(reason.trim())}>Confirm Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskStatusChangeModal;
