import mongoose, { Document, Schema, Model } from "mongoose";
export interface IUser extends Document {
  uid: string;
  username: string;
  avatar: string;
  friends: string[];
}

const UserSchema: Schema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    avatar: { type: String, required: true },
    friends: [{ type: String }], // array of friend uids or usernames
  },
  { timestamps: true }
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);