import { z } from "zod";
import { Board } from "@prisma/client"; // expected output

import { ActionState } from "@/lib/create-safe-action";

import { CreateBoard } from "./schema";

// https://zod.dev/?id=type-inference
export type InputType = z.infer<typeof CreateBoard>;
export type ReturnType = ActionState<InputType, Board>;
