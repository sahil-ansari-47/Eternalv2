import mongoose, { Document, Schema, Model } from "mongoose";

// 1. Message Interface + Mongoose Document
export interface IMessage extends Document {
  id: number;
  sender: string;
  receiver: string;
  text: string;
  room?: string;
}

const MessageSchema: Schema = new Schema<IMessage>(
  {
    id: { type: Number, required: true, unique: true },
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    text: { type: String, required: true },
    room: { type: String, required: false },
  },
  { timestamps: true }
);

export const MessageModel: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);