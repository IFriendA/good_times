"use client";

import { PointerEvent, ReactNode, useRef, useState } from "react";
import { entryTime } from "../lib/date";
import { ActivityEntry } from "../lib/types";
import Gauge from "./Gauge";
import { CloseIcon, EditIcon, EyeIcon, EyeOffIcon, SparkleIcon, TrashIcon } from "./Icons";

const ACTIONS_WIDTH = 152;

type Props = {
  entry: ActivityEntry;
  isOpen: boolean;
  isEditing: boolean;
  editorExpanded: boolean;
  editor: ReactNode;
  onOpen: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleHidden: () => void;
  onEditorAnimationEnd: (expanded: boolean) => void;
};

export default function SwipeableEntryCard({
  entry,
  isOpen,
  isEditing,
  editorExpanded,
  editor,
  onOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleHidden,
  onEditorAnimationEnd,
}: Props) {
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const pointerId = useRef<number | null>(null);
  const direction = useRef<"horizontal" | "vertical" | null>(null);

  const offset = isEditing ? 0 : dragOffset ?? (isOpen ? -ACTIONS_WIDTH : 0);
  const actionsVisible = !isEditing && (isOpen || dragging || dragOffset !== null);

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (isEditing) return;
    if ((event.target as Element).closest("button")) return;
    pointerId.current = event.pointerId;
    startX.current = event.clientX;
    startY.current = event.clientY;
    startOffset.current = isOpen ? -ACTIONS_WIDTH : 0;
    direction.current = null;
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (pointerId.current !== event.pointerId) return;
    const deltaX = event.clientX - startX.current;
    const deltaY = event.clientY - startY.current;

    if (!direction.current && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 7) {
      direction.current = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
      if (direction.current === "horizontal") {
        setDragging(true);
        setDragOffset(startOffset.current);
        event.currentTarget.setPointerCapture(event.pointerId);
      } else {
        pointerId.current = null;
      }
    }
    if (direction.current !== "horizontal") return;

    const nextOffset = Math.max(-ACTIONS_WIDTH, Math.min(0, startOffset.current + deltaX));
    setDragOffset(nextOffset);
  }

  function finishSwipe(event: PointerEvent<HTMLElement>) {
    if (pointerId.current !== event.pointerId) return;
    const swipeDirection = direction.current;
    const finalOffset = Math.max(
      -ACTIONS_WIDTH,
      Math.min(0, startOffset.current + event.clientX - startX.current),
    );
    const shouldOpen = swipeDirection === "horizontal" && finalOffset < -ACTIONS_WIDTH * 0.36;
    pointerId.current = null;
    direction.current = null;
    setDragging(false);
    if (swipeDirection === "horizontal") {
      const targetOffset = shouldOpen ? -ACTIONS_WIDTH : 0;
      setDragOffset(Math.abs(finalOffset - targetOffset) < 0.5 ? null : targetOffset);
      if (shouldOpen) onOpen();
      else onClose();
    } else if (!swipeDirection && isOpen) {
      setDragOffset(0);
      onClose();
    }
  }

  const hidden = entry.hidden === true;

  return (
    <div
      className={`swipe-entry ${isOpen ? "swipe-entry--open" : ""} ${actionsVisible ? "swipe-entry--actions-visible" : ""} ${isEditing ? "swipe-entry--editing" : ""} ${editorExpanded ? "swipe-entry--editor-expanded" : ""}`}
      data-entry-id={entry.id}
    >
      <div className="swipe-actions" aria-hidden={!actionsVisible}>
        <button
          className="swipe-actions__hide"
          type="button"
          onClick={() => {
            onToggleHidden();
            setDragOffset(0);
            onClose();
          }}
          tabIndex={isOpen ? 0 : -1}
        >
          {hidden ? <EyeIcon /> : <EyeOffIcon />}
          <span>{hidden ? "显示" : "隐藏"}</span>
        </button>
        <button
          className="swipe-actions__delete"
          type="button"
          onClick={onDelete}
          tabIndex={isOpen ? 0 : -1}
        >
          <TrashIcon />
          <span>删除</span>
        </button>
      </div>

      <article
        className={`entry-card paper-card swipe-entry__card ${dragging ? "swipe-entry__card--dragging" : ""}`}
        style={offset === 0 ? undefined : { transform: `translateX(${offset}px)` }}
        onPointerDown={isEditing ? undefined : handlePointerDown}
        onPointerMove={isEditing ? undefined : handlePointerMove}
        onPointerUp={isEditing ? undefined : finishSwipe}
        onPointerCancel={isEditing ? undefined : finishSwipe}
        onTransitionEnd={(event) => {
          if (event.propertyName === "transform" && !dragging) setDragOffset(null);
        }}
      >
        <button
          className="entry-card__edit"
          type="button"
          onClick={onEdit}
          aria-label={isEditing ? `关闭${entry.title}的编辑` : `编辑${entry.title}`}
          aria-expanded={isEditing && editorExpanded}
        >
          {isEditing ? <CloseIcon size={18} /> : <EditIcon size={18} />}
        </button>

        <div className={`entry-card__content ${hidden ? "entry-card__content--hidden" : ""}`}>
          <div className="entry-card__top">
            <div>
              <div className="entry-card__title-row">
                <time dateTime={`${entry.date}T${entryTime(entry.time, entry.createdAt)}`}>
                  {entryTime(entry.time, entry.createdAt)}
                </time>
                <h3>{entry.title}</h3>
              </div>
              {entry.detail && <p>{entry.detail}</p>}
            </div>
            {entry.flow && <span className="flow-badge"><SparkleIcon size={15} /> 心流</span>}
          </div>
          <div className="entry-card__gauges">
            <Gauge kind="engagement" value={entry.engagement} compact />
            <Gauge kind="energy" value={entry.energy} compact />
          </div>
        </div>

        {hidden && !isEditing && (
          <div className="entry-card__hidden-label" aria-label="这条记录已隐藏">
            <EyeOffIcon size={15} /> 已隐藏
          </div>
        )}

        {isEditing && (
          <div
            className={`inline-editor-shell ${editorExpanded ? "inline-editor-shell--expanded" : ""}`}
            onTransitionEnd={(event) => {
              if (event.target === event.currentTarget && event.propertyName === "grid-template-rows") {
                onEditorAnimationEnd(editorExpanded);
              }
            }}
          >
            <div className="inline-editor-shell__inner">{editor}</div>
          </div>
        )}
      </article>
    </div>
  );
}
