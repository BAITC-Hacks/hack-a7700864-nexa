export type ReadinessLevel = "Черновик" | "Рабочая" | "Готовая" | "Приоритетная";
export type ProposalStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type ClarificationQuestion = { id: "users" | "data" | "success" | "constraints" | "result" | "contact"; question: string };

export type TaskCard = {
  id?: string; title: string; category: string; originalDescription: string; context: string; need: string;
  users: string; dataMaterials: string; constraints: string; expectedResult: string; successCriteria: string;
  contact: string; interactionFormat: string; score?: number; readinessLevel?: ReadinessLevel;
  confirmed?: boolean; published?: boolean; createdAt?: string | Date; updatedAt?: string | Date;
};
export type Team = { id: string; name: string; interests: string; skills: string; technologies: string; createdAt?: string | Date };
export type Proposal = { id: string; taskId: string; teamId: string; solutionIdea: string; plan: string; estimatedTime: string; prototypeUrl: string; status: ProposalStatus; createdAt: string | Date; updatedAt?: string | Date; team?: Team };

export const emptyCard = (description = ""): TaskCard => ({
  title: "", category: "AI / IT", originalDescription: description, context: "", need: description,
  users: "", dataMaterials: "", constraints: "", expectedResult: "", successCriteria: "",
  contact: "", interactionFormat: "",
});
