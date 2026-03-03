"use client";

import { Camera, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CameraCaptureDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (dataUrl: string) => void;
}

const MAX_IMAGE_SIZE = 500 * 1024;
const JPEG_QUALITY = 0.7;

export function CameraCaptureDialog({
  isOpen,
  onOpenChange,
  onCapture,
}: CameraCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      return;
    }

    setError(null);
    setIsLoading(true);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsLoading(false);
      })
      .catch(() => {
        setError("Não foi possível acessar a câmera. Verifique as permissões.");
        setIsLoading(false);
        toast.error("Erro ao acessar a webcam.");
      });

    return stopStream;
  }, [isOpen, stopStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.srcObject) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    let quality = JPEG_QUALITY;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);

    while (dataUrl.length > MAX_IMAGE_SIZE && quality > 0.1) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }

    if (dataUrl.length > MAX_IMAGE_SIZE) {
      toast.error("A imagem ficou muito grande. Tente novamente.");
      return;
    }

    onCapture(dataUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tirar foto</DialogTitle>
          <DialogDescription>
            Posicione o rosto no quadro e clique em Capturar
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-lg bg-muted">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="size-12 animate-spin text-muted-foreground" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-destructive">
                {error}
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${isLoading || error ? "invisible" : ""}`}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCapture}
              disabled={isLoading || !!error}
            >
              <Camera className="mr-2 size-4" />
              Capturar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
