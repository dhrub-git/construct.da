"use server";
import { FilesStrict, GenerateProjectReport, ProjectSpecs, ProjectStage, ProjectStatus, ProjectStrict, ProjectWithFiles } from "@models/data";
import prisma from "../prisma";
import { addressToCoordinatesGoogle } from "../geoEncoding";
import { Prisma } from "@prisma/client";
import { ExtractedFacts, RulesPack } from "../agent/types";
import { buildFixtureSpatialConstraints, SpatialConstraintSource, SPATIAL_FIXTURE_RETRIEVED_AT } from "../spatial";


export async function getProjectsForUser(userId: string): Promise<ProjectStrict[]> {
    try {
        const projects = await prisma.project.findMany({
            where: {
                userId,
            }
        });

        return projects.map(project => ({
            ...project,
            metadata: project.metadata as unknown as Pick<ProjectStrict, "metadata">["metadata"],
        }));
    } catch (error) {
        console.error("Error fetching projects for user:", error);
        throw error;
    }
}

export async function createProject(projectSpecs: ProjectSpecs): Promise<ProjectStrict> {
    try {
        // Get GeoEncoding data for the project address
        const geoEncoding = await addressToCoordinatesGoogle(projectSpecs.address);

        if (!geoEncoding) {
            throw new Error(`Failed to geocode the provided address: ${projectSpecs.address}`);
        }

        const spatialConstraints = buildFixtureSpatialConstraints({
            address: projectSpecs.address,
            council: projectSpecs.council,
        });

        const newProject = await prisma.project.create({
            data: {
                name: projectSpecs.name,
                description: projectSpecs.description,
                address: projectSpecs.address,
                type: projectSpecs.type,
                council: projectSpecs.council,
                userId: projectSpecs.userId,
                metadata: {
                    geoEncoding: {
                        lat: geoEncoding.lat,
                        lng: geoEncoding.lng,
                    },
                    runId: null,
                    stage: projectSpecs.files.length > 0 ? ProjectStage.FILES_UPLOADED : ProjectStage.CREATED,
                    processingStatus: projectSpecs.files.length > 0 ? ProjectStatus.NEEDS_REVIEW : ProjectStatus.CREATED,
                    filesUpdatedAt: projectSpecs.files.length > 0 ? new Date().toISOString() : undefined,
                    spatialConstraints,
                    spatialConstraintsLoadedAt: SPATIAL_FIXTURE_RETRIEVED_AT,
                    spatialConstraintsSource: SpatialConstraintSource.FIXTURE,
                },
                Files: {
                    createMany: {
                        data: projectSpecs.files.map(file => ({
                            name: file.filename,
                            url: file.url,
                            metadata: {
                                mimeType: file.mimetype,
                                size: file.size,
                                fileType: file.fileType,
                            },
                            userId: file.userId,
                        })),
                    },
                }
            }
        });

        return {
            ...newProject,
            metadata: newProject.metadata as unknown as Pick<ProjectWithFiles, "metadata">["metadata"],
        };
    } catch (error) {
        console.error("Error creating project:", error);
        throw error;
    }
}

export async function getProjectById(projectId: string): Promise<ProjectWithFiles> {
    try {
        const project = await prisma.project.findUnique({
            where: {
                id: projectId,
            },
            include: {
                Files: true,
            }
        });

        if (!project) {
            throw new Error(`Project not found for ID: ${projectId}`);
        }

        return {
            ...project,
            metadata: project.metadata as unknown as Pick<ProjectWithFiles, "metadata">["metadata"],
            Files: project.Files.map(file => ({
                ...file,
                metadata: file.metadata as Pick<FilesStrict, "metadata">["metadata"],
            })),
        };
    } catch (error) {
        console.error("Error fetching project by ID:", error);
        throw error;
    }
}

export async function deleteProject(projectId: string): Promise<void> {
    try {
        await prisma.project.delete({
            where: {
                id: projectId,
            },
        });
    } catch (error) {
        console.error("Error deleting project:", error);
        throw error;
    }
}

function mergeMetadata(
    current: Record<string, unknown>,
    patch?: Record<string, unknown>
): Prisma.InputJsonValue {
    if (!patch) {
        return current as Prisma.InputJsonObject;
    }

    const merged = deepMerge(current, patch);
    return merged as Prisma.InputJsonObject;
}

function deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
): Record<string, unknown> {
    const output: Record<string, unknown> = { ...target };

    for (const [key, value] of Object.entries(source)) {
        if (
            isPlainObject(value) &&
            isPlainObject(output[key])
        ) {
            output[key] = deepMerge(
                output[key] as Record<string, unknown>,
                value as Record<string, unknown>
            );
            continue;
        }

        output[key] = value;
    }

    return output;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export async function updateProjectMetadata(projectId: string, metadata: Partial<Pick<ProjectStrict, "metadata">["metadata"]>): Promise<void> {
    try {
        const project = await prisma.project.findUnique({
            where: {
                id: projectId,
            },
        });
        if (!project) {
            throw new Error(`Project not found for ID: ${projectId}`);
        }
        const currentMetadata = project.metadata as unknown as Record<string, unknown>;
        const mergedMetadata = mergeMetadata(currentMetadata, metadata);

        await prisma.project.update({
            where: {
                id: projectId,
            },
            data: {
                metadata: mergedMetadata,
            },
        });

    } catch (error) {
        console.error("Error updating project metadata:", error);
        throw error;
    }
}

export async function fetchProjectGeneratedReports(projectId: string): Promise<GenerateProjectReport[]> {
    try {
        const reports = await prisma.projectReport.findMany({
            where: {
                projectId,
            },
            orderBy: [
                { version: "desc" },
                { createdAt: "desc" },
            ],
            include: {
                findings: true,
                checkResults: true,
            }
        });

        return reports.map(report => ({
            ...report,
            facts: report.factsJson as unknown as ExtractedFacts,
            rules: report.rulesJson as unknown as RulesPack,
            content: report.content as unknown as Pick<GenerateProjectReport, "content">["content"],
            rawOutput: report.rawOutputJson as unknown as Pick<GenerateProjectReport, "rawOutput">["rawOutput"],
        }));
    } catch (error) {
        console.error("Error fetching generated reports for project:", error);
        throw error;
    }
}