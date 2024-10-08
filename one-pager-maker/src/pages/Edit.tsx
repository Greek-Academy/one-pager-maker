import "./Edit.css";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Document, Status } from "../entity/documentType.ts";
import { Link, useParams } from "react-router-dom";
import { UserSelectMenu } from "../stories/UserItem.tsx";
import { RiPencilFill } from "react-icons/ri";
import { BiCommentEdit } from "react-icons/bi";
import { GoClock } from "react-icons/go";
import { documentApi } from "../api/documentApi.ts";
import { viewHistoryApi } from "@/api/viewHistoryApi.ts";
import { userApi } from "@/api/userApi.ts";
import { selectUser } from "@/redux/user/selector.ts";
import { useAppSelector } from "@/redux/hooks.ts";
import { MarkdownRenderer } from "../components/ui/MarkdownRenderer";
import { v4 as uuidv4 } from "uuid";

function Edit() {
  const { uid, documentId } = useParams<{ uid: string; documentId: string }>();

  const authUserUid = useAppSelector(selectUser)?.uid;
  const userQuery = userApi.useFindUserByUIDQuery(authUserUid ?? "");

  if (uid === undefined || documentId === undefined) {
    // this is called when route setting is wrong
    return <main>Route setting is wrong</main>;
  }

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const documentResult = documentApi.useGetDocumentQuery({ uid, documentId });
  const document = documentResult.data?.value;
  const [documentData, setDocumentData] = useState(document);
  const [cursorPosition, setCursorPosition] = useState(0);
  const updateDocument = documentApi.useUpdateDocumentMutation();

  const editHistoryMutation = viewHistoryApi.useSetEditHistoryMutation();
  const reviewHistoryMutation = viewHistoryApi.useSetReviewHistoryMutation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertImageMarkdown = (imageUrl: string) => {
    const imageMarkdown = `![Image](${imageUrl})\n`;
    const { selectionStart = 0, value = "" } = textareaRef.current ?? {};
    const newContent =
      value.slice(0, selectionStart) +
      imageMarkdown +
      value.slice(selectionStart);

    updateDocumentState("contents", newContent);
    setCursorPosition(selectionStart + imageMarkdown.length);
  };

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.selectionStart = cursorPosition;
    textarea.selectionEnd = cursorPosition;
  }, [cursorPosition]);

  useEffect(() => {
    if (document && !documentData) {
      setDocumentData(document);
    }
  }, [document, documentData]);

  const updateDocumentState = <K extends keyof Document>(
    key: K,
    val: Document[K]
  ) => {
    setDocumentData((prev) =>
      prev === undefined ? prev : { ...prev, [key]: val }
    );
  };
  const onChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) =>
    updateDocumentState("title", e.target.value);
  const onChangeContents = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    updateDocumentState("contents", textarea.value);
    setCursorPosition(textarea.selectionStart);
  };
  const onPasteContents = async (
    e: React.ClipboardEvent<HTMLTextAreaElement>
  ) => {
    const imageItem = Array.from(e.clipboardData.items).find((item) =>
      item.type.startsWith("image/")
    );
    if (!imageItem) return;

    e.preventDefault();

    const file = imageItem.getAsFile();
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      alert("Image is too large. Please upload images smaller than 5MB.");
      return;
    }

    try {
      const uniqueFileName = `${uuidv4()}-${file.name}`;
      const storageRef = ref(storage, `images/${uniqueFileName}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      insertImageMarkdown(imageUrl);
    } catch (e) {
      alert(`Failed to upload image: ${e?.toString()}. Please try again.`);
    }
  };
  const onChangeStatus = (e: React.ChangeEvent<HTMLSelectElement>) =>
    updateDocumentState("status", e.target.value as Status);
  const onChangeContributors = (e: React.ChangeEvent<HTMLInputElement>) =>
    updateDocumentState("contributors", e.target.value.split(","));
  const onChangeReviewers = (e: React.ChangeEvent<HTMLInputElement>) =>
    updateDocumentState("reviewers", e.target.value.split(","));
  const handleAddingUser = (
    user: string,
    key: "contributors" | "reviewers"
  ) => {
    const preUser = documentData ? documentData[key] : [];
    const value = preUser[0] === "" ? [user] : [...preUser, user];
    if (key == "reviewers") {
      updateDocumentState("status", "reviewed");
    }
    updateDocumentState(key, value);
  };

  const onClickSave = async () => {
    if (uid == undefined) return;
    if (documentData == undefined) return;
    if (!userQuery.data) return;

    try {
      const result = await updateDocument.mutateAsync({
        uid,
        document: documentData
      });

      setDocumentData(result);

      // 更新したときに閲覧履歴を設定
      const mutationArgs = {
        uid: userQuery.data.id,
        documentId: documentData.id,
        document: result
      };
      if (documentData.status === "reviewed") {
        reviewHistoryMutation.mutate(mutationArgs);
      } else {
        editHistoryMutation.mutate(mutationArgs);
      }
    } catch (e) {
      alert(`エラー: ${e?.toString()}`);
    }
  };

  if (
    documentResult.data?.error &&
    documentResult.data?.error.code === "permission-denied"
  ) {
    return (
      <main
        className={
          "flex w-screen flex-col justify-center gap-12 bg-background pt-48"
        }
      >
        <h1 className={"text-center text-4xl font-bold"}>403 Forbidden</h1>
        <p className={"text-center text-2xl"}>
          <span>Permission denied. </span>
          <Link to={"/"} className={"text-link hover:underline"}>
            Click here to return to the home page.
          </Link>
        </p>
      </main>
    );
  }

  return (
    <>
      <div>
        <div className="flex justify-between py-1">
          <input
            className="w-full border px-1 font-bold"
            type="text"
            value={documentData?.title}
            onChange={onChangeTitle}
          ></input>
          <button
            className="border-4 border-solid"
            type="button"
            onClick={onClickSave}
          >
            Save
          </button>
          <button
            className="border-4 border-solid"
            type="button"
            onClick={onClickSave}
          >
            Published
          </button>
        </div>
        <div className="flex justify-between">
          <span>
            <select
              className="mx-1 mr-5 border"
              name="status"
              value={documentData?.status}
              onChange={onChangeStatus}
            >
              <option value="draft">draft</option>
              <option value="reviewed">reviewed</option>
              <option value="final">final</option>
              <option value="obsolete">obsolete</option>
            </select>
            <RiPencilFill className="inline" />
            <input
              className="contributors mx-1 border px-1"
              type="text"
              value={documentData?.contributors}
              onChange={onChangeContributors}
            ></input>
            <UserSelectMenu
              onSelectUser={(e) => handleAddingUser(e, "contributors")}
            />
            <span className="mr-5" />
            <BiCommentEdit className="inline" />
            <input
              className="reviewers mx-1 border px-1"
              type="text"
              value={documentData?.reviewers}
              onChange={onChangeReviewers}
            ></input>
            <UserSelectMenu
              onSelectUser={(e) => handleAddingUser(e, "reviewers")}
            />
          </span>
          <span>
            <GoClock className="mx-1 inline" />
            <span className="updated px-1 italic">
              {documentData?.updated_at.toDate().toLocaleString()}
            </span>
          </span>
        </div>
        <div className="flex h-svh w-full p-1">
          <textarea
            ref={textareaRef}
            className="w-1/2 border p-1"
            value={documentData?.contents}
            onChange={onChangeContents}
            onPaste={onPasteContents}
            placeholder="Enter Markdown here"
          />
          <div className="w-1/2 overflow-visible overflow-scroll overflow-x-hidden border p-1">
            <MarkdownRenderer contents={documentData?.contents || ""} />
          </div>
        </div>
      </div>
    </>
  );
}

export default Edit;
