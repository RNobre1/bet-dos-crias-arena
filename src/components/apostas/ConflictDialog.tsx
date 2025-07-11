
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConflictResult, getConflictResolutionOptions } from "@/utils/betConflictValidator";

interface ConflictDialogProps {
  isOpen: boolean;
  conflict: ConflictResult;
  onResolve: (action: 'replace' | 'cancel') => void;
}

const ConflictDialog: React.FC<ConflictDialogProps> = ({
  isOpen,
  conflict,
  onResolve
}) => {
  if (!conflict.hasConflict || !conflict.conflictType) {
    return null;
  }

  const options = getConflictResolutionOptions(conflict.conflictType);

  return (
    <AlertDialog open={isOpen} onOpenChange={() => onResolve('cancel')}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Conflito de Apostas Detectado</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>{conflict.conflictMessage}</p>
            <p className="text-sm text-gray-600">{options.message}</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onResolve('cancel')}>
            {options.cancel}
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => onResolve('replace')}>
            {options.replace}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConflictDialog;
