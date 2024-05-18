import {z} from "zod"

export const message = z.object({
    id: z.string(),
    text: z.string(),
    isUserMessage: z.boolean(),
})

// valiating the array as we are also having previous user data
export const MessageArraySchema = z.array(message);

export type Message = z.infer<typeof message>;