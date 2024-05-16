import {DocumentRepository} from "./documentRepository.ts";
import {ForCreate, WithTimestamp} from "../entity/utils.ts";
import {Document, documentConverter} from "../entity/documentType.ts";
import {collection, doc, serverTimestamp, Timestamp,} from "firebase/firestore";
import {db} from "../firebase.ts";
import {FirestoreClientManager} from "./shared/firestoreClientManager.ts";

export class DocumentRepositoryImpl implements DocumentRepository {
    private readonly colRef = (uid: string) => collection(db, `users/${uid}/documents`)
        .withConverter(documentConverter);
    private readonly docRef = (uid: string, docId: string) => doc(db, `users/${uid}/documents/${docId}`)
        .withConverter(documentConverter)

    private readonly clientManager = FirestoreClientManager.INSTANCE;

    async create({uid, document}: {
        uid: string;
        document: ForCreate<Document>
    }): Promise<Document> {
        try {
            const ref = doc(this.colRef(uid));
            const data: WithTimestamp<Document> = {
                ...document,
                id: ref.id,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
                deleted_at: null
            }
            await this.clientManager.getClient().set(ref, data);

            return {
                ...data,
                created_at: Timestamp.now(),
                updated_at: Timestamp.now(),
                deleted_at: null,
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async delete({uid, document}: {
        uid: string,
        document: Document
    }): Promise<Document> {
        try {
            await this.clientManager.getClient().update(this.docRef(uid, document.id), {
                updated_at: serverTimestamp(),
                deleted_at: serverTimestamp(),
            });

            return {
                ...document,
                updated_at: Timestamp.now(),
                deleted_at: Timestamp.now()
            };
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async get({uid, documentId}: {
        uid: string;
        documentId: string
    }): Promise<Document | null> {
        try {
            const snapshot = await this.clientManager.getClient().get(this.docRef(uid, documentId));
            return snapshot.data() ?? null;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async getMany(args: { uid: string }): Promise<Document[]> {
        try {
            const snapshot = await this.clientManager.getClient().getMany(this.colRef(args.uid));
            return snapshot.docs.map(d => d.data());
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async update({uid, document}: {
        uid: string;
        document: Document
    }): Promise<Document> {
        try {
            await this.clientManager.getClient().update(this.docRef(uid, document.id), {
                ...document,
                updated_at: serverTimestamp(),
            });
            return {
                ...document,
                updated_at: Timestamp.now()
            };
        } catch (e) {
            return Promise.reject(e);
        }
    }


}
