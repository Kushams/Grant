"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { ActionState } from "./action";

/**
 * Wraps a server action for use with <form onSubmit>.
 *
 * Why not <form action={fn}>? React 19 automatically RESETS uncontrolled fields after a form
 * action finishes — even when the server rejected the input — which would wipe what the user
 * typed. Dispatching manually keeps their input so they can correct it. (Trade-off: these forms
 * need JavaScript; the read-only/GET search forms remain plain HTML.)
 */
export function useActionForm(action: (prev: ActionState, fd: FormData) => Promise<ActionState>) {
  const [state, dispatch, pending] = useActionState(
    async (prev: ActionState, fd: FormData) => action(prev, fd),
    null,
  );
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => {
      dispatch(fd);
    });
  };
  return { state, onSubmit, pending };
}
