import { ForCreate, ForUpdate } from "./utils.ts";
import { Document } from "./documentType.ts";
import { Timestamp } from "firebase/firestore";

export const mockDocument = {
  doc: {
    contents: "",
    contributors: [],
    deleted_at: null,
    owner_id: "",
    reviewers: [],
    status: "draft",
    title: "",
    url_privilege: "private",
    id: "testDocument",
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
    published_at: null,
    path: "",
    filename: ""
  } as Document,
  forCreate: {
    contents: "",
    contributors: [],
    deleted_at: null,
    owner_id: "",
    reviewers: [],
    status: "draft",
    title: "",
    url_privilege: "private",
    published_at: null,
    path: "",
    filename: ""
  } as ForCreate<Document>,

  forUpdate: {
    title: "Updated Title"
  } as ForUpdate<Document>
};
