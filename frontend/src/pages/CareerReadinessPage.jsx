import React, { useEffect, useState } from "react";
import { readCurrentUser } from "../lib/currentUser";

function CareerReadinessPage() {
    const [careerAnalysis, setCareerAnalysis] = useState(null);
    const [careerEvidence, setCareerEvidence] = useState(null);

    const [roles, setRoles] = useState([]);
    const [targetRole, setTargetRole] = useState("");

    const [loading, setLoading] = useState(false);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [error, setError] = useState("");

    const formatSkillName = (skill = "") => {
        const specialNames = {
            "rest apis": "REST APIs",
            "mongodb": "MongoDB",
            "node.js": "Node.js",
            "express.js": "Express.js",
            "javascript": "JavaScript",
            "react": "React",
            "html": "HTML",
            "css": "CSS",
            "sql": "SQL",
            "git": "Git",
            "problem solving": "Problem Solving",
            "communication": "Communication",
        };

        const normalized = skill.toLowerCase().trim();

        return (
            specialNames[normalized] ||
            normalized.replace(/\b\w/g, (char) => char.toUpperCase())
        );
    };

    // ==========================================
    // PROFICIENCY VALUES
    // ==========================================

    const PROFICIENCY_VALUES = {
        beginner: 35,
        basic: 35,
        intermediate: 60,
        advanced: 75,
        pro: 85,
        expert: 95,
    };

    // ==========================================
    // NORMALIZE SKILL NAME
    // ==========================================

    const normalizeSkillName = (skill) => {
        if (!skill) return "";

        return String(skill)
            .trim()
            .toLowerCase();
    };

    // ==========================================
    // CONVERT PROFILE SKILLS TO OBJECTS
    // ==========================================

    const normalizeProfileSkills = (value) => {
        if (!value) return [];

        if (Array.isArray(value)) {
            return value
                .map((item) => {
                    if (
                        item &&
                        typeof item === "object"
                    ) {
                        return {
                            name:
                                item.name ||
                                item.skill ||
                                item.title ||
                                "",
                            level:
                                item.level ||
                                item.proficiency ||
                                item.proficiency_level ||
                                "beginner",
                        };
                    }

                    return {
                        name: String(item),
                        level: "beginner",
                    };
                })
                .filter(
                    (item) =>
                        item.name &&
                        String(item.name).trim()
                );
        }

        if (
            typeof value === "string" &&
            value.trim()
        ) {
            return value
                .split(",")
                .map((item) => ({
                    name: item.trim(),
                    level: "beginner",
                }))
                .filter((item) => item.name);
        }

        if (
            value &&
            typeof value === "object"
        ) {
            return Object.entries(value).map(
                ([name, level]) => ({
                    name,
                    level:
                        typeof level === "string"
                            ? level
                            : "beginner",
                })
            );
        }

        return [];
    };

    // ==========================================
    // CONVERT PROFILE SKILLS TO NAMES
    // ==========================================

    const getSkillNames = (skills) => {
        return skills
            .map((skill) => skill.name)
            .filter(Boolean);
    };

    // ==========================================
    // BUILD PROFICIENCY-AWARE SKILL MAP
    // ==========================================

    const buildSkillProficiencyMap = (
        profileSkills
    ) => {
        const result = {};

        profileSkills.forEach((skill) => {
            const normalizedName =
                normalizeSkillName(skill.name);

            if (!normalizedName) return;

            const level =
                String(
                    skill.level || "beginner"
                ).toLowerCase();

            const score =
                PROFICIENCY_VALUES[level] ||
                PROFICIENCY_VALUES.beginner;

            result[normalizedName] = Math.max(
                result[normalizedName] || 0,
                score
            );
        });

        return result;
    };

    // ==========================================
    // LOAD AVAILABLE CAREER ROLES
    // ==========================================

    useEffect(() => {
        const loadRoles = async () => {
            try {
                setRolesLoading(true);

                const response = await fetch(
                    "http://localhost:8000/career/roles"
                );

                if (!response.ok) {
                    throw new Error(
                        "Failed to load career roles"
                    );
                }

                const data =
                    await response.json();

                setRoles(data.roles || []);
            } catch (error) {
                console.error(
                    "Role loading error:",
                    error
                );

                setError(
                    "Unable to load career roles. Please make sure the backend is running."
                );
            } finally {
                setRolesLoading(false);
            }
        };

        loadRoles();
    }, []);

    // ==========================================
    // LOAD CAREER READINESS
    // ==========================================

    const loadCareerReadiness = async () => {
        if (
            !targetRole ||
            targetRole.trim().length < 2
        ) {
            setError(
                "Please select a target role first."
            );
            return;
        }

        try {
            setLoading(true);
            setError("");

            const user =
                readCurrentUser() || {};

            // ==========================================
            // USER SKILLS
            // ==========================================

            const rawResumeSkills =
                user.resume_skills ||
                user.resumeSkills ||
                user.skills ||
                [];

            const profileSkills =
                normalizeProfileSkills(
                    rawResumeSkills
                );

            const resumeSkillNames =
                getSkillNames(profileSkills);

            // ==========================================
            // PROFICIENCY-AWARE SKILL MAP
            //
            // Example:
            //
            // React.js -> 85
            // REST API -> 60
            // ==========================================

            const proficiencySkills =
                buildSkillProficiencyMap(
                    profileSkills
                );

            console.log(
                "Profile skills:",
                profileSkills
            );

            console.log(
                "Proficiency-aware skills:",
                proficiencySkills
            );

            // ==========================================
            // PROJECT SKILLS
            // ==========================================

            const projectSkills =
                normalizeProfileSkills(
                    user.project_skills ||
                    user.projectSkills ||
                    []
                );

            const projectSkillNames =
                getSkillNames(projectSkills);

            // ==========================================
            // GITHUB SKILLS
            // ==========================================

            const githubSkills =
                normalizeProfileSkills(
                    user.github_skills ||
                    user.githubSkills ||
                    []
                );

            const githubSkillNames =
                getSkillNames(githubSkills);

            // ==========================================
            // PROJECTS
            // ==========================================

            const projects = Array.isArray(
                user.projects
            )
                ? user.projects
                : [];

            // ==========================================
            // MOCK TESTS
            // ==========================================

            const mockTests =
                Array.isArray(
                    user.mock_tests
                )
                    ? user.mock_tests
                    : Array.isArray(
                        user.mockTests
                    )
                        ? user.mockTests
                        : [];

            // ==========================================
            // ATS SCORE
            // ==========================================

            const atsScore = Number(
                user.ats_score ||
                user.atsScore ||
                0
            );

            // ==========================================
            // INTERVIEW SCORE
            // ==========================================

            const interviewScore = Number(
                user.interview_score ||
                user.interviewScore ||
                0
            );

            // ==========================================
            // CAREER EVIDENCE
            //
            // IMPORTANT:
            // Evidence API currently expects
            // strings, not skill objects.
            // ==========================================

            const evidenceResponse =
                await fetch(
                    "http://localhost:8000/career/evidence",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            resume_skills:
                                resumeSkillNames,

                            project_skills:
                                projectSkillNames,

                            github_skills:
                                githubSkillNames,

                            projects:
                                projects,

                            mock_tests:
                                mockTests,

                            ats_score:
                                Number.isFinite(
                                    atsScore
                                )
                                    ? atsScore
                                    : 0,

                            interview_score:
                                Number.isFinite(
                                    interviewScore
                                )
                                    ? interviewScore
                                    : 0,
                        }),
                    }
                );

            if (!evidenceResponse.ok) {
                const errorText =
                    await evidenceResponse.text();

                console.error(
                    "Career evidence error:",
                    errorText
                );

                let message =
                    "Failed to load career evidence";

                try {
                    const errorData =
                        JSON.parse(
                            errorText
                        );

                    if (
                        Array.isArray(
                            errorData?.detail
                        )
                    ) {
                        message =
                            errorData.detail
                                .map(
                                    (item) =>
                                        item.msg
                                )
                                .join(", ");
                    } else if (
                        typeof errorData?.detail ===
                        "string"
                    ) {
                        message =
                            errorData.detail;
                    }
                } catch {
                    // Keep default message
                }

                throw new Error(message);
            }

            const evidence =
                await evidenceResponse.json();

            setCareerEvidence(evidence);

            // ==========================================
            // COMBINE PROFICIENCY DATA
            //
            // Profile proficiency is the primary
            // skill evidence.
            //
            // Project/GitHub evidence can strengthen
            // a skill if it exists there.
            // ==========================================

            const finalSkills = {
                ...proficiencySkills,
            };

            // Project evidence
            projectSkills.forEach(
                (skill) => {
                    const name =
                        normalizeSkillName(
                            skill.name
                        );

                    if (!name) return;

                    finalSkills[name] = Math.max(
                        finalSkills[name] || 0,
                        70
                    );
                }
            );

            // GitHub evidence
            githubSkills.forEach(
                (skill) => {
                    const name =
                        normalizeSkillName(
                            skill.name
                        );

                    if (!name) return;

                    finalSkills[name] = Math.max(
                        finalSkills[name] || 0,
                        75
                    );
                }
            );

            console.log(
                "Final career skill evidence:",
                finalSkills
            );

            // ==========================================
            // CAREER ANALYSIS
            // ==========================================

            const analysisResponse =
                await fetch(
                    "http://localhost:8000/career/analyze",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            user_id: user.id
                                ? Number(
                                    user.id
                                )
                                : null,

                            target_role:
                                targetRole,

                            // IMPORTANT:
                            // Send proficiency-aware
                            // skill scores.
                            skills:
                                finalSkills,

                            ats_score:
                                Number(
                                    evidence.ats_score ||
                                    0
                                ),

                            project_score:
                                Number(
                                    evidence.project_score ||
                                    0
                                ),

                            interview_score:
                                Number(
                                    evidence.interview_score ||
                                    0
                                ),

                            assessment_score:
                                Number(
                                    evidence.assessment_score ||
                                    0
                                ),
                        }),
                    }
                );

            if (!analysisResponse.ok) {
                const errorText =
                    await analysisResponse.text();

                console.error(
                    "Career analysis error:",
                    errorText
                );

                let message =
                    "Failed to load career analysis";

                try {
                    const errorData =
                        JSON.parse(
                            errorText
                        );

                    if (
                        Array.isArray(
                            errorData?.detail
                        )
                    ) {
                        message =
                            errorData.detail
                                .map(
                                    (item) =>
                                        item.msg
                                )
                                .join(", ");
                    } else if (
                        typeof errorData?.detail ===
                        "string"
                    ) {
                        message =
                            errorData.detail;
                    }
                } catch {
                    // Keep default message
                }

                throw new Error(message);
            }

            const analysis =
                await analysisResponse.json();

            console.log(
                "Career analysis:",
                analysis
            );

            setCareerAnalysis(analysis);
        } catch (err) {
            console.error(
                "Career readiness error:",
                err
            );

            setError(
                err.message ||
                "Failed to load career readiness analysis."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // LOADING SCREEN
    // ==========================================

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "#07100d",
                    color: "#f5f7f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection:
                        "column",
                    gap: "15px",
                }}
            >
                <div
                    style={{
                        width: "38px",
                        height: "38px",
                        border:
                            "3px solid #24342e",
                        borderTop:
                            "3px solid #55d99b",
                        borderRadius: "50%",
                        animation:
                            "careerSpin 0.8s linear infinite",
                    }}
                />

                <p
                    style={{
                        color: "#8d9b95",
                        fontSize: "14px",
                    }}
                >
                    Analyzing your career
                    readiness...
                </p>

                <style>
                    {`
                        @keyframes careerSpin {
                            to {
                                transform: rotate(360deg);
                            }
                        }
                    `}
                </style>
            </div>
        );
    }

    // ==========================================
    // PAGE DATA
    // ==========================================

    const componentScores =
        careerAnalysis?.component_scores ||
        {};

    const priorityGaps =
        careerAnalysis?.priority_gaps ||
        [];

    /*
     * New backend may return all_skills.
     * Older backend returns skill_gaps.
     *
     * Support both so the UI does not break.
     */

    const allSkills =
        careerAnalysis?.all_skills ||
        careerAnalysis?.skill_gaps ||
        [];

    const readiness = Math.round(
        Number(
            careerAnalysis?.readiness_score ||
            0
        )
    );

    // ==========================================
    // MAIN PAGE
    // ==========================================

    return (
        <div
            style={{
                minHeight: "100vh",
                padding: "35px",
                background: "#07100d",
                color: "#f5f7f6",
            }}
        >
            {/* ===================================== */}
            {/* HEADER */}
            {/* ===================================== */}

            <div
                style={{
                    display: "flex",
                    justifyContent:
                        "space-between",
                    alignItems: "flex-end",
                    gap: "30px",
                    marginBottom: "32px",
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <div
                        style={{
                            color: "#55d99b",
                            fontSize: "11px",
                            fontWeight: "700",
                            letterSpacing:
                                "3px",
                            marginBottom:
                                "8px",
                        }}
                    >
                        AI CAREER INTELLIGENCE
                    </div>

                    <h1
                        style={{
                            margin: 0,
                            fontSize: "34px",
                            fontWeight: "700",
                        }}
                    >
                        Career Readiness
                    </h1>

                    <p
                        style={{
                            maxWidth:
                                "650px",
                            marginTop:
                                "12px",
                            color: "#9ba9a4",
                            lineHeight:
                                "1.6",
                        }}
                    >
                        Understand your
                        current
                        employability,
                        identify skill
                        gaps, and build
                        a personalized
                        career roadmap.
                    </p>
                </div>

                {/* TARGET ROLE */}

                <div
                    style={{
                        minWidth:
                            "220px",
                        padding:
                            "18px 22px",
                        border:
                            "1px solid rgba(85,217,155,0.25)",
                        borderRadius:
                            "16px",
                        background:
                            "#0c1814",
                    }}
                >
                    <div
                        style={{
                            color: "#82918b",
                            fontSize:
                                "12px",
                            marginBottom:
                                "7px",
                        }}
                    >
                        TARGET ROLE
                    </div>

                    <strong
                        style={{
                            fontSize:
                                "17px",
                        }}
                    >
                        {careerAnalysis?.target_role ||
                            targetRole ||
                            "Not selected"}
                    </strong>
                </div>
            </div>

            {/* ===================================== */}
            {/* ROLE SELECTION */}
            {/* ===================================== */}

            <div
                style={{
                    padding: "24px",
                    marginBottom:
                        "30px",
                    border:
                        "1px solid rgba(85,217,155,0.18)",
                    borderRadius:
                        "18px",
                    background:
                        "#0c1814",
                }}
            >
                <div
                    style={{
                        color: "#55d99b",
                        fontSize:
                            "11px",
                        fontWeight:
                            "700",
                        letterSpacing:
                            "2px",
                        marginBottom:
                            "8px",
                    }}
                >
                    CAREER TARGET
                </div>

                <h2
                    style={{
                        margin: 0,
                        fontSize:
                            "21px",
                    }}
                >
                    What role are you
                    preparing for?
                </h2>

                <p
                    style={{
                        color: "#8d9b95",
                        marginTop:
                            "8px",
                        marginBottom:
                            "18px",
                        lineHeight:
                            "1.5",
                    }}
                >
                    Select your target
                    career role so
                    SkillNet can compare
                    your current skills
                    with the requirements
                    of that role.
                </p>

                <div
                    style={{
                        display:
                            "flex",
                        gap: "12px",
                        alignItems:
                            "center",
                        flexWrap:
                            "wrap",
                    }}
                >
                    <select
                        value={
                            targetRole
                        }
                        onChange={(
                            e
                        ) => {
                            setTargetRole(
                                e.target
                                    .value
                            );

                            setError(
                                ""
                            );

                            setCareerAnalysis(
                                null
                            );

                            setCareerEvidence(
                                null
                            );
                        }}
                        disabled={
                            rolesLoading
                        }
                        style={{
                            flex: "1",
                            minWidth:
                                "250px",
                            padding:
                                "14px 16px",
                            borderRadius:
                                "12px",
                            border:
                                "1px solid rgba(255,255,255,0.12)",
                            background:
                                "#111",
                            color:
                                "#fff",
                            fontSize:
                                "15px",
                            outline:
                                "none",
                        }}
                    >
                        <option value="">
                            {rolesLoading
                                ? "Loading career roles..."
                                : "Select Target Role"}
                        </option>

                        {roles.map(
                            (
                                role
                            ) => (
                                <option
                                    key={
                                        role
                                    }
                                    value={
                                        role
                                    }
                                >
                                    {
                                        role
                                    }
                                </option>
                            )
                        )}
                    </select>

                    <button
                        onClick={
                            loadCareerReadiness
                        }
                        disabled={
                            !targetRole ||
                            loading ||
                            rolesLoading
                        }
                        style={{
                            padding:
                                "14px 22px",
                            borderRadius:
                                "12px",
                            border:
                                "none",
                            background:
                                "#55d99b",
                            color:
                                "#07100d",
                            fontWeight:
                                "700",
                            cursor:
                                !targetRole ||
                                    loading ||
                                    rolesLoading
                                    ? "not-allowed"
                                    : "pointer",
                            opacity:
                                !targetRole ||
                                    loading ||
                                    rolesLoading
                                    ? 0.6
                                    : 1,
                            whiteSpace:
                                "nowrap",
                        }}
                    >
                        Analyze My
                        Readiness →
                    </button>
                </div>

                {error && (
                    <div
                        style={{
                            marginTop:
                                "15px",
                            padding:
                                "12px 15px",
                            borderRadius:
                                "10px",
                            background:
                                "rgba(255,90,90,0.08)",
                            border:
                                "1px solid rgba(255,90,90,0.2)",
                            color:
                                "#ff8c8c",
                            fontSize:
                                "13px",
                        }}
                    >
                        {error}
                    </div>
                )}
            </div>

            {/* ===================================== */}
            {/* BEFORE ANALYSIS */}
            {/* ===================================== */}

            {!careerAnalysis && (
                <div
                    style={{
                        padding:
                            "55px 30px",
                        border:
                            "1px solid rgba(85,217,155,0.15)",
                        borderRadius:
                            "20px",
                        background:
                            "linear-gradient(135deg, #0c1814, #0a1512)",
                        textAlign:
                            "center",
                    }}
                >
                    <div
                        style={{
                            width:
                                "70px",
                            height:
                                "70px",
                            margin:
                                "0 auto 20px",
                            borderRadius:
                                "50%",
                            background:
                                "rgba(85,217,155,0.08)",
                            border:
                                "1px solid rgba(85,217,155,0.2)",
                            display:
                                "flex",
                            alignItems:
                                "center",
                            justifyContent:
                                "center",
                            fontSize:
                                "30px",
                        }}
                    >
                        🎯
                    </div>

                    <h2
                        style={{
                            margin: 0,
                            fontSize:
                                "23px",
                        }}
                    >
                        Start Your Career
                        Readiness Analysis
                    </h2>

                    <p
                        style={{
                            maxWidth:
                                "600px",
                            margin:
                                "12px auto 0",
                            color:
                                "#8d9b95",
                            lineHeight:
                                "1.6",
                        }}
                    >
                        Select a target
                        role above and
                        analyze your
                        resume, projects,
                        skills,
                        assessments and
                        interview evidence
                        against that
                        career path.
                    </p>
                </div>
            )}

            {/* ===================================== */}
            {/* RESULTS */}
            {/* ===================================== */}

            {careerAnalysis && (
                <>
                    {/* ================================= */}
                    {/* TOP CARDS */}
                    {/* ================================= */}

                    <div
                        style={{
                            display:
                                "grid",
                            gridTemplateColumns:
                                "minmax(280px, 1fr) minmax(350px, 1.3fr)",
                            gap: "20px",
                            marginBottom:
                                "30px",
                        }}
                    >
                        {/* READINESS SCORE */}

                        <div
                            style={{
                                padding:
                                    "26px",
                                border:
                                    "1px solid rgba(85,217,155,0.18)",
                                borderRadius:
                                    "18px",
                                background:
                                    "#0c1814",
                            }}
                        >
                            <div
                                style={{
                                    color:
                                        "#7e9189",
                                    fontSize:
                                        "11px",
                                    fontWeight:
                                        "700",
                                    letterSpacing:
                                        "2px",
                                }}
                            >
                                OVERALL READINESS
                            </div>

                            <div
                                style={{
                                    margin:
                                        "18px 0",
                                    fontSize:
                                        "58px",
                                    fontWeight:
                                        "800",
                                }}
                            >
                                {
                                    readiness
                                }

                                <span
                                    style={{
                                        marginLeft:
                                            "6px",
                                        color:
                                            "#75837e",
                                        fontSize:
                                            "20px",
                                    }}
                                >
                                    /100
                                </span>
                            </div>

                            <div
                                style={{
                                    height:
                                        "8px",
                                    background:
                                        "#1c2a25",
                                    borderRadius:
                                        "10px",
                                    overflow:
                                        "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        width: `${Math.min(
                                            Math.max(
                                                readiness,
                                                0
                                            ),
                                            100
                                        )}%`,
                                        height:
                                            "100%",
                                        background:
                                            "#55d99b",
                                        borderRadius:
                                            "10px",
                                    }}
                                />
                            </div>

                            <p
                                style={{
                                    marginTop:
                                        "18px",
                                    color:
                                        "#84918d",
                                    lineHeight:
                                        "1.6",
                                    fontSize:
                                        "13px",
                                }}
                            >
                                Your readiness
                                score combines
                                skill
                                proficiency,
                                resume evidence,
                                projects,
                                assessments and
                                interview
                                performance.
                            </p>
                        </div>

                        {/* COMPONENT SCORES */}

                        <div
                            style={{
                                padding:
                                    "26px",
                                border:
                                    "1px solid rgba(85,217,155,0.18)",
                                borderRadius:
                                    "18px",
                                background:
                                    "#0c1814",
                            }}
                        >
                            <div
                                style={{
                                    color:
                                        "#7e9189",
                                    fontSize:
                                        "11px",
                                    fontWeight:
                                        "700",
                                    letterSpacing:
                                        "2px",
                                    marginBottom:
                                        "20px",
                                }}
                            >
                                READINESS COMPONENTS
                            </div>

                            <ScoreRow
                                label="Skill Alignment"
                                value={
                                    componentScores.skill_alignment ||
                                    0
                                }
                            />

                            <ScoreRow
                                label="Resume / ATS"
                                value={
                                    componentScores.resume_ats ||
                                    0
                                }
                            />

                            <ScoreRow
                                label="Projects"
                                value={
                                    componentScores.projects ||
                                    0
                                }
                            />

                            <ScoreRow
                                label="Interview"
                                value={
                                    componentScores.interview ||
                                    0
                                }
                            />

                            <ScoreRow
                                label="Assessment"
                                value={
                                    componentScores.assessment ||
                                    0
                                }
                            />
                        </div>
                    </div>

                    {/* ================================= */}
                    {/* PRIORITY GAPS */}
                    {/* ================================= */}

                    <section
                        style={{
                            marginTop:
                                "30px",
                        }}
                    >
                        <div
                            style={{
                                marginBottom:
                                    "18px",
                            }}
                        >
                            <div
                                style={{
                                    color:
                                        "#55d99b",
                                    fontSize:
                                        "11px",
                                    fontWeight:
                                        "700",
                                    letterSpacing:
                                        "2.5px",
                                    marginBottom:
                                        "7px",
                                }}
                            >
                                AI ANALYSIS
                            </div>

                            <h2
                                style={{
                                    margin: 0,
                                    fontSize:
                                        "21px",
                                }}
                            >
                                Priority Skill Gaps
                            </h2>
                        </div>

                        {priorityGaps.length ===
                            0 ? (
                            <div
                                style={{
                                    padding:
                                        "25px",
                                    border:
                                        "1px solid rgba(85,217,155,0.16)",
                                    borderRadius:
                                        "16px",
                                    background:
                                        "#0c1814",
                                    color:
                                        "#8d9b95",
                                }}
                            >
                                No priority
                                skill gaps
                                were
                                identified
                                for this
                                role.
                            </div>
                        ) : (
                            <div
                                style={{
                                    display:
                                        "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fit, minmax(280px, 1fr))",
                                    gap: "16px",
                                }}
                            >
                                {priorityGaps.map(
                                    (
                                        gap,
                                        index
                                    ) => (
                                        <div
                                            key={
                                                index
                                            }
                                            style={{
                                                padding:
                                                    "20px",
                                                border:
                                                    "1px solid rgba(85,217,155,0.16)",
                                                borderRadius:
                                                    "16px",
                                                background:
                                                    "#0c1814",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems:
                                                        "center",
                                                    marginBottom:
                                                        "18px",
                                                }}
                                            >
                                                <strong>
                                                    {
                                                        gap.skill
                                                    }
                                                </strong>

                                                <span
                                                    style={{
                                                        padding:
                                                            "5px 10px",
                                                        borderRadius:
                                                            "20px",
                                                        background:
                                                            "rgba(255,183,77,0.12)",
                                                        color:
                                                            "#ffbd66",
                                                        fontSize:
                                                            "11px",
                                                        textTransform:
                                                            "uppercase",
                                                    }}
                                                >
                                                    {
                                                        gap.priority
                                                    }
                                                </span>
                                            </div>

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    marginBottom:
                                                        "15px",
                                                }}
                                            >
                                                <Metric
                                                    label="Current"
                                                    value={`${Math.round(
                                                        gap.current ||
                                                        0
                                                    )}%`}
                                                />

                                                <Metric
                                                    label="Required"
                                                    value={`${Math.round(
                                                        gap.required ||
                                                        0
                                                    )}%`}
                                                />

                                                <Metric
                                                    label="Gap"
                                                    value={`${Math.round(
                                                        gap.gap ||
                                                        0
                                                    )}%`}
                                                />
                                            </div>

                                            <div
                                                style={{
                                                    height:
                                                        "9px",
                                                    background:
                                                        "#1c2a25",
                                                    borderRadius:
                                                        "10px",
                                                    overflow:
                                                        "hidden",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${Math.min(
                                                            Math.max(
                                                                gap.current ||
                                                                0,
                                                                0
                                                            ),
                                                            100
                                                        )}%`,
                                                        height:
                                                            "100%",
                                                        background:
                                                            "#55d99b",
                                                        borderRadius:
                                                            "10px",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </section>

                    <section>
                        {/* SKILL GAPS */}
                        <div style={{ marginTop: "32px" }}>
                            <div
                                style={{
                                    fontSize: "12px",
                                    letterSpacing: "2px",
                                    color: "#55d99b",
                                    fontWeight: "600",
                                    marginBottom: "10px",
                                }}
                            >
                                AI ANALYSIS
                            </div>

                            <h2
                                style={{
                                    margin: "0 0 18px",
                                    fontSize: "22px",
                                    fontWeight: "600",
                                    color: "#ffffff",
                                }}
                            >
                                Skill Gaps
                            </h2>

                            <div
                                style={{
                                    background: "rgba(10, 28, 22, 0.72)",
                                    border: "1px solid rgba(85, 217, 155, 0.20)",
                                    borderRadius: "18px",
                                    padding: "8px 24px",
                                }}
                            >
                                {careerAnalysis?.skill_gaps?.length > 0 ? (
                                    careerAnalysis.skill_gaps.map((gap, index) => (
                                        <div
                                            key={`${formatSkillName(gap.skill)}-${index}`}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                padding: "18px 0",
                                                borderBottom:
                                                    index !== careerAnalysis.skill_gaps.length - 1
                                                        ? "1px solid rgba(255,255,255,0.08)"
                                                        : "none",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        color: "#ffffff",
                                                        fontSize: "15px",
                                                        fontWeight: "600",
                                                        marginBottom: "6px",
                                                    }}
                                                >
                                                    {formatSkillName(gap.skill)}
                                                </div>

                                                <div
                                                    style={{
                                                        color: "#8fa9a0",
                                                        fontSize: "13px",
                                                    }}
                                                >
                                                    Current: {Number(gap.current || 0)}%
                                                    {" • "}
                                                    Required: {Number(gap.required || 0)}%
                                                    {" • "}
                                                    Gap: {Number(gap.gap || 0)}%
                                                </div>
                                            </div>

                                            <span
                                                style={{
                                                    padding: "6px 12px",
                                                    borderRadius: "999px",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    color:
                                                        gap.priority === "high"
                                                            ? "#ff8f8f"
                                                            : gap.priority === "medium"
                                                                ? "#ffd27a"
                                                                : "#55d99b",
                                                    background:
                                                        gap.priority === "high"
                                                            ? "rgba(255, 80, 80, 0.10)"
                                                            : gap.priority === "medium"
                                                                ? "rgba(255, 190, 80, 0.10)"
                                                                : "rgba(85, 217, 155, 0.10)",
                                                }}
                                            >
                                                {(gap.priority || "low").toUpperCase()}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div
                                        style={{
                                            padding: "28px 0",
                                            textAlign: "center",
                                            color: "#8fa9a0",
                                            fontSize: "14px",
                                        }}
                                    >
                                        No skill gaps identified for this role.
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ================================= */}
                    {/* ROADMAP */}
                    {/* ================================= */}

                    <section
                        style={{
                            display:
                                "flex",
                            justifyContent:
                                "space-between",
                            alignItems:
                                "center",
                            gap: "30px",
                            marginTop:
                                "30px",
                            padding:
                                "28px",
                            border:
                                "1px solid rgba(85,217,155,0.25)",
                            borderRadius:
                                "20px",
                            background:
                                "#0d2119",
                            flexWrap:
                                "wrap",
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    color:
                                        "#55d99b",
                                    fontSize:
                                        "11px",
                                    fontWeight:
                                        "700",
                                    letterSpacing:
                                        "2.5px",
                                    marginBottom:
                                        "7px",
                                }}
                            >
                                NEXT STEP
                            </div>

                            <h2
                                style={{
                                    margin: 0,
                                    fontSize:
                                        "21px",
                                }}
                            >
                                Build Your
                                Personalized
                                Career
                                Roadmap
                            </h2>

                            <p
                                style={{
                                    color:
                                        "#8d9b95",
                                    marginTop:
                                        "8px",
                                }}
                            >
                                Turn your
                                skill gaps
                                into a
                                structured
                                learning
                                and
                                practice
                                plan.
                            </p>
                        </div>

                        <button
                            style={{
                                border:
                                    "none",
                                borderRadius:
                                    "10px",
                                padding:
                                    "13px 20px",
                                background:
                                    "#55d99b",
                                color:
                                    "#07100d",
                                fontWeight:
                                    "700",
                                cursor:
                                    "pointer",
                                whiteSpace:
                                    "nowrap",
                            }}
                            onClick={() => {
                                console.log(
                                    "Opening career roadmap"
                                );
                            }}
                        >
                            View Career
                            Roadmap →
                        </button>
                    </section>
                </>
            )}
        </div>
    );
}

// ==========================================
// SCORE ROW
// ==========================================

function ScoreRow({
    label,
    value,
}) {
    const score = Math.round(
        Number(value || 0)
    );

    return (
        <div
            style={{
                marginBottom:
                    "17px",
            }}
        >
            <div
                style={{
                    display:
                        "flex",
                    justifyContent:
                        "space-between",
                    marginBottom:
                        "7px",
                    color:
                        "#d5ded9",
                    fontSize:
                        "13px",
                }}
            >
                <span>
                    {label}
                </span>

                <strong
                    style={{
                        color:
                            "#55d99b",
                    }}
                >
                    {score}%
                </strong>
            </div>

            <div
                style={{
                    height:
                        "7px",
                    background:
                        "#1c2a25",
                    borderRadius:
                        "10px",
                    overflow:
                        "hidden",
                }}
            >
                <div
                    style={{
                        width: `${Math.min(
                            Math.max(
                                score,
                                0
                            ),
                            100
                        )}%`,
                        height:
                            "100%",
                        background:
                            "#55d99b",
                        borderRadius:
                            "10px",
                    }}
                />
            </div>
        </div>
    );
}

// ==========================================
// METRIC
// ==========================================

function Metric({
    label,
    value,
}) {
    return (
        <span
            style={{
                display:
                    "flex",
                flexDirection:
                    "column",
                gap: "4px",
                color:
                    "#7f8e88",
                fontSize:
                    "11px",
            }}
        >
            {label}

            <b
                style={{
                    color:
                        "#e5ebe8",
                    fontSize:
                        "14px",
                }}
            >
                {value}
            </b>
        </span>
    );
}

export default CareerReadinessPage;