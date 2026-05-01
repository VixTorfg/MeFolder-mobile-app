import React from "react";
import type { MediaHostProps } from "@/types/media/viewers";
import { AudioPlayer } from "../AudioPlayer";
import { ImageViewer } from "../ImageViewer";
import { VideoPlayer } from "../VideoPlayer";

export default function MediaHost({
  item,
  onClose,
  autoPlay = false,
  onSwipeNext,
  onSwipePrevious,
  imageWidth,
  imageHeight,
}: MediaHostProps) {
  if (!item) {
    return null;
  }

  const mediaKey = item.fileId ?? `${item.category}:${item.uri}`;
  const swipeProps = {
    ...(onSwipeNext ? { onSwipeNext } : {}),
    ...(onSwipePrevious ? { onSwipePrevious } : {}),
  };
  const imageSizeProps = {
    ...(imageWidth != null ? { imageWidth } : {}),
    ...(imageHeight != null ? { imageHeight } : {}),
  };

  switch (item.category) {
    case "image":
      return (
        <ImageViewer
          key={mediaKey}
          source={item}
          visible
          onClose={onClose}
          {...swipeProps}
          {...imageSizeProps}
        />
      );

    case "video":
      return (
        <VideoPlayer
          key={mediaKey}
          source={item}
          visible
          onClose={onClose}
          autoPlay={autoPlay}
          {...swipeProps}
        />
      );

    case "audio":
      return (
        <AudioPlayer
          key={mediaKey}
          source={item}
          visible
          onClose={onClose}
          autoPlay={autoPlay}
        />
      );

    default:
      return null;
  }
}
