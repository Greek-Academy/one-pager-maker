import { DocumentService, DocumentServiceError } from "./documentService.ts";
import { DocumentRepository } from "../repository/documentRepository.ts";
import { Document } from "../entity/documentType.ts";
import { inject, injectable } from "tsyringe";
import { DI } from "../di.ts";
import { ForUpdate } from "../entity/utils.ts";
import { ViewHistoryService } from "@/service/viewHistoryService.ts";
import { Result } from "result-type-ts";
import { FirestoreError } from "@firebase/firestore";
import { Timestamp } from "firebase/firestore";

@injectable()
export class DocumentServiceImpl implements DocumentService {
  constructor(
    @inject(DI.DocumentRepository)
    private documentRepository: DocumentRepository,
    @inject(DI.ViewHistoryService)
    private viewHistoryService: ViewHistoryService
  ) {}

  async getDocument({
    uid,
    filepath
  }: {
    uid: string;
    filepath: string;
  }): Promise<Result<Document | undefined, DocumentServiceError>> {
    try {
      const result = await this.documentRepository.getByPath({
        uid,
        filepath
      });

      return Result.success(result ?? undefined);
    } catch (e) {
      if (e instanceof FirestoreError) {
        switch (e.code) {
          case "permission-denied":
            return Result.failure(
              new DocumentServiceError(e.message, "permission-denied")
            );
          case "not-found":
            return Result.success(undefined);
          default:
            return Result.failure(
              new DocumentServiceError(e.message, "unknown")
            );
        }
      }
      return Promise.reject(e);
    }
  }

  async createDocument({
    uid,
    filepath,
    filename
  }: {
    uid: string;
    filepath: string;
    filename: string;
  }): Promise<Document> {
    const template = `# Summary

# Background

# Design/Proposal

# Open questions

# Reference

# Memo

`;
    try {
      const doc = await this.documentRepository.create({
        uid,
        document: {
          title: "New document",
          contents: template,
          status: "draft",
          owner_id: uid,
          contributors: [uid],
          reviewers: [],
          url_privilege: "private",
          deleted_at: null,
          published_at: null,
          filename,
          filepath
        }
      });
      await this.viewHistoryService.setEditHistory({ uid, documentId: doc.id });
      return doc;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async deleteDocument({
    uid,
    filepath
  }: {
    uid: string;
    filepath: string;
  }): Promise<Document> {
    try {
      return await this.documentRepository.deleteByPath({
        uid,
        filepath
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async updateDocument(
    uid: string,
    document: ForUpdate<Document>
  ): Promise<Document> {
    try {
      return await this.documentRepository.update({
        uid,
        document
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async setDocumentPublishStatus(
    uid: string,
    documentId: string,
    isPublished: boolean
  ): Promise<Document> {
    try {
      const published_at = isPublished ? Timestamp.now() : null;
      return await this.documentRepository.update({
        uid,
        document: {
          id: documentId,
          published_at
        }
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getDocumentsByPath({
    uid,
    filepath
  }: {
    uid: string;
    filepath: string;
  }): Promise<Document[]> {
    try {
      return await this.documentRepository.getManyByPath({ uid, filepath });
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
