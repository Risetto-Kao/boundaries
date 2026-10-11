import { Prisma, type PrismaClient } from "@prisma/client";
import { createInvite, guestLifetime, hashToken, matchesInvite, revealInvite, submissionGuestToken, validToken } from "./form-tokens";
import type { MessageKey } from "./i18n/config";

export class FormError extends Error {
  constructor(public status: number, public key: MessageKey) { super(key); }
}
export type Actor = { userId: string | null; guestToken?: string };
type TemplateInput = { title: string; description?: string; questions: string[] };
type SubmissionInput = { nickname: string; requestKey: string; invite?: string; answers: { questionId: string; value: string }[] };
const templateFields = { id: true, title: true, description: true, ownerType: true, authorName: true, createdAt: true, updatedAt: true, sourceId: true, questions: { orderBy: { orderIndex: "asc" as const }, select: { id: true, text: true, orderIndex: true } } };
const transactionOptions = { timeout: 15_000, maxWait: 5_000 };
const requireUser = (userId: string | null) => { if (!userId) throw new FormError(403, "loginRequired"); return userId; };

export class FormService {
  constructor(private db: PrismaClient) {}
  async templates() {
    return this.db.template.findMany({ where: { deletedAt: null }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: templateFields });
  }
  async template(id: string) {
    return this.db.template.findFirst({ where: { id, deletedAt: null }, select: templateFields });
  }
  async canEditTemplate(id: string, userId: string | null) {
    return Boolean(userId && await this.db.template.findFirst({ where: { id, ownerId: userId, ownerType: "USER", deletedAt: null }, select: { id: true } }));
  }
  async createTemplate(userId: string | null, authorName: string | null, input: TemplateInput) {
    return this.db.template.create({ data: { ownerId: requireUser(userId), ownerType: "USER", authorName, title: input.title, description: input.description || null,
      questions: { createMany: { data: input.questions.map((text, index) => ({ text, orderIndex: index + 1 })) } } }, select: templateFields });
  }
  async updateTemplate(userId: string | null, id: string, input: TemplateInput & { updatedAt: string }) {
    requireUser(userId);
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM boundary_templates WHERE id = ${id} FOR UPDATE`;
      const template = await tx.template.findFirst({ where: { id, ownerId: userId, ownerType: "USER", deletedAt: null }, select: { updatedAt: true } });
      if (!template) throw new FormError(404, "accessDenied");
      if (template.updatedAt.toISOString() !== input.updatedAt) throw new FormError(409, "surveyChanged");
      // Template questions have no submissions. Replace the entire set atomically.
      await tx.templateQuestion.deleteMany({ where: { templateId: id } });
      await tx.templateQuestion.createMany({ data: input.questions.map((text, index) => ({ templateId: id, text, orderIndex: index + 1 })) });
      return tx.template.update({ where: { id }, data: { title: input.title, description: input.description || null }, select: templateFields });
    }, transactionOptions);
  }
  async deleteTemplate(userId: string | null, id: string) {
    const result = await this.db.template.updateMany({ where: { id, ownerId: requireUser(userId), ownerType: "USER", deletedAt: null }, data: { deletedAt: new Date() } });
    if (!result.count) throw new FormError(404, "accessDenied");
  }
  async copyTemplate(userId: string | null, authorName: string | null, id: string) {
    requireUser(userId);
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM boundary_templates WHERE id = ${id} FOR UPDATE`;
      const source = await tx.template.findFirst({ where: { id, deletedAt: null }, select: templateFields });
      if (!source) throw new FormError(404, "accessDenied");
      return tx.template.create({ data: { title: source.title, description: source.description, ownerId: userId, ownerType: "USER", authorName, sourceId: id,
        questions: { createMany: { data: source.questions.map(({ text, orderIndex }) => ({ text, orderIndex })) } } }, select: { id: true } });
    }, transactionOptions);
  }
  async generateForm(userId: string | null, id: string) {
    requireUser(userId);
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM boundary_templates WHERE id = ${id} FOR UPDATE`;
      const source = await tx.template.findFirst({ where: { id, deletedAt: null }, select: templateFields });
      if (!source) throw new FormError(404, "accessDenied");
      return tx.fillableForm.create({ data: { ownerId: userId!, title: source.title, description: source.description, sourceId: id, ...createInvite(),
        questions: { createMany: { data: source.questions.map(({ text, orderIndex }) => ({ text, orderIndex })) } } }, select: { id: true } });
    }, transactionOptions);
  }
  private async guest(actor: Actor, db: Prisma.TransactionClient = this.db) {
    if (!validToken(actor.guestToken)) return null;
    return db.guestSession.findFirst({ where: { tokenHash: hashToken(actor.guestToken!), expiresAt: { gt: new Date() } }, select: { id: true, expiresAt: true } });
  }
  async access(id: string, actor: Actor, invite?: string, db: Prisma.TransactionClient = this.db) {
    const form = await db.fillableForm.findUnique({ where: { id }, select: { id: true, ownerId: true, title: true, description: true, isOpen: true, inviteHash: true, accessVersion: true } });
    if (!form) throw new FormError(404, "accessDenied");
    const guest = await this.guest(actor, db);
    const identities = [...(actor.userId ? [{ userId: actor.userId }] : []), ...(guest ? [{ guestSessionId: guest.id }] : [])];
    const submissions = identities.length ? await db.submission.findMany({ where: { formId: id, OR: identities }, select: { id: true, userId: true, guestSessionId: true, accessVersion: true } }) : [];
    const invited = Boolean(matchesInvite(invite, form.inviteHash));
    const owner = Boolean(actor.userId && form.ownerId === actor.userId);
    if (!owner && !invited && !submissions.some(s => s.accessVersion === form.accessVersion)) throw new FormError(404, "accessDenied");
    return { form, owner, invited, submissions, guest, canResults: submissions.some(s => s.accessVersion === form.accessVersion) };
  }
  async questions(id: string, actor: Actor, invite?: string) {
    const access = await this.access(id, actor, invite);
    const questions = await this.db.formQuestion.findMany({ where: { formId: id }, orderBy: { orderIndex: "asc" }, select: { id: true, text: true } });
    return { ...access, questions };
  }
  async renewResults(id: string, actor: Actor, invite: string) {
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM boundary_forms WHERE id = ${id} FOR UPDATE`;
      const access = await this.access(id, actor, invite, tx);
      if (!access.invited || !access.submissions.length) throw new FormError(403, "resultsLocked");
      await tx.submission.updateMany({ where: { id: { in: access.submissions.map(s => s.id) }, formId: id }, data: { accessVersion: access.form.accessVersion } });
    }, transactionOptions);
  }
  async matrix(id: string, actor: Actor) {
    // Recheck access and read answers inside the same locked transaction. A link
    // reset or deletion cannot race a stale authorization check.
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM boundary_forms WHERE id = ${id} FOR SHARE`;
      const access = await this.access(id, actor, undefined, tx);
      if (!access.canResults) throw new FormError(403, "resultsLocked");
      const questions = await tx.formQuestion.findMany({ where: { formId: id }, orderBy: { orderIndex: "asc" }, select: { id: true, text: true } });
      const participants = await tx.submission.findMany({ where: { formId: id }, orderBy: { submittedAt: "asc" }, select: { id: true, nickname: true, answers: { select: { questionId: true, value: true } } } });
      return { title: access.form.title, description: access.form.description, questions, participants };
    }, transactionOptions);
  }
  async management(id: string, userId: string | null) {
    const form = await this.db.fillableForm.findFirst({ where: { id, ownerId: requireUser(userId) }, select: { id: true, title: true, description: true, updatedAt: true, isOpen: true, inviteEncrypted: true, accessVersion: true,
      questions: { orderBy: { orderIndex: "asc" }, select: { id: true, text: true } }, submissions: { orderBy: { submittedAt: "asc" }, select: { id: true, submittedAt: true } } } });
    if (!form) throw new FormError(404, "accessDenied");
    const { inviteEncrypted, ...safe } = form;
    return { ...safe, invitePath: `/forms/${id}?invite=${revealInvite(inviteEncrypted)}` };
  }
  async manage(id: string, userId: string | null, input: { action: "metadata" | "close" | "open" | "reset" | "deleteSubmission" | "delete"; title?: string; description?: string; updatedAt?: string; submissionId?: string }) {
    const ownerId = requireUser(userId);
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM boundary_forms WHERE id = ${id} FOR UPDATE`;
      const form = await tx.fillableForm.findFirst({ where: { id, ownerId }, select: { updatedAt: true } });
      if (!form) throw new FormError(404, "accessDenied");
      if (input.updatedAt !== form.updatedAt.toISOString()) throw new FormError(409, "surveyChanged");
      switch (input.action) {
        case "metadata": return tx.fillableForm.update({ where: { id }, data: { title: input.title!, description: input.description || null }, select: { id: true } });
        case "close": case "open": return tx.fillableForm.update({ where: { id }, data: { isOpen: input.action === "open" }, select: { id: true } });
        case "reset": return tx.fillableForm.update({ where: { id }, data: { ...createInvite(), accessVersion: { increment: 1 } }, select: { id: true } });
        case "deleteSubmission": {
          if (!input.submissionId) throw new FormError(400, "invalidInput");
          const deleted = await tx.submission.deleteMany({ where: { id: input.submissionId, formId: id } });
          if (!deleted.count) throw new FormError(404, "accessDenied");
          return tx.fillableForm.update({ where: { id }, data: { updatedAt: new Date() }, select: { id: true } });
        }
        case "delete": return tx.fillableForm.delete({ where: { id }, select: { id: true } });
      }
    }, transactionOptions);
  }
  async submit(id: string, actor: Actor, input: SubmissionInput) {
    const currentGuest = await this.guest(actor);
    const token = actor.userId ? undefined : currentGuest ? actor.guestToken : submissionGuestToken(input.requestKey);
    const guestActor = { ...actor, guestToken: token };
    const requestHash = hashToken(input.requestKey);
    const payloadHash = hashToken(JSON.stringify({ id, nickname: input.nickname, answers: [...input.answers].sort((a, b) => a.questionId.localeCompare(b.questionId)) }));
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM boundary_forms WHERE id = ${id} FOR UPDATE`;
      const access = await this.access(id, guestActor, input.invite, tx);
      const replay = await tx.submission.findUnique({ where: { requestHash }, select: { id: true, formId: true, userId: true, guestSessionId: true, payloadHash: true } });
      if (replay) {
        if (replay.formId !== id || replay.payloadHash !== payloadHash || (actor.userId ? replay.userId !== actor.userId : !access.guest || replay.guestSessionId !== access.guest.id)) throw new FormError(409, "submitConflict");
        return { id: replay.id, guestToken: token, guestExpiresAt: access.guest?.expiresAt };
      }
      if (!access.form.isOpen) throw new FormError(403, "formClosed");
      const questions = await tx.formQuestion.findMany({ where: { formId: id }, select: { id: true } });
      const questionIds = new Set(questions.map(q => q.id));
      if (input.answers.length !== questions.length || new Set(input.answers.map(a => a.questionId)).size !== questions.length || input.answers.some(a => !questionIds.has(a.questionId) || !["yes", "no", "depends"].includes(a.value))) throw new FormError(400, "answersMismatch");
      let guest = actor.userId ? null : access.guest;
      if (!actor.userId && !guest) guest = await tx.guestSession.create({ data: { tokenHash: hashToken(token!), expiresAt: new Date(Date.now() + guestLifetime * 1000) }, select: { id: true, expiresAt: true } });
      const identity = actor.userId ? { userId: actor.userId } : { guestSessionId: guest!.id };
      if (await tx.submission.findFirst({ where: { formId: id, ...identity }, select: { id: true } })) throw new FormError(409, "alreadySubmitted");
      const submission = await tx.submission.create({ data: { formId: id, ...identity, nickname: input.nickname, requestHash, payloadHash, accessVersion: access.form.accessVersion,
        answers: { createMany: { data: input.answers } } }, select: { id: true } });
      return { id: submission.id, guestToken: token, guestExpiresAt: guest?.expiresAt };
    }, transactionOptions).catch(error => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new FormError(409, "alreadySubmitted");
      throw error;
    });
  }
}
