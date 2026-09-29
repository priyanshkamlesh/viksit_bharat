import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function CareerRoadmapPage() {
    const navigate = useNavigate();

    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const formatSkillName = (skill = "") => {
        const names = {
            "problem solving": "Problem Solving",
            "git": "Git",
            "mongodb": "MongoDB",
            "sql": "SQL",
            "communication": "Communication",
            "rest apis": "REST APIs",
            "javascript": "JavaScript",
            "react": "React",
            "node.js": "Node.js",
        };

        const normalized = skill.toLowerCase().trim();

        return (
            names[normalized] ||
            normalized.replace(/\b\w/g, (char) =>
                char.toUpperCase()
            )
        );
    };

    const priorityStyle = (priority) => {
        const value = priority?.toLowerCase();

        if (value === "high") {
            return {
                background: "rgba(255,90,90,0.12)",
                border: "1px solid rgba(255,90,90,0.25)",
                color: "#ff8c8c",
            };
        }

        if (value === "medium") {
            return {
                background: "rgba(255,190,80,0.12)",
                border: "1px solid rgba(255,190,80,0.25)",
                color: "#ffc56b",
            };
        }

        return {
            background: "rgba(85,217,155,0.10)",
            border: "1px solid rgba(85,217,155,0.22)",
            color: "#55d99b",
        };
    };

    useEffect(() => {
        const loadRoadmap = async () => {
            try {
                setLoading(true);
                setError("");

                const storedData =
                    localStorage.getItem(
                        "careerRoadmapData"
                    );

                if (!storedData) {
                    throw new Error(
                        "Career roadmap data was not found."
                    );
                }

                const data = JSON.parse(storedData);

                if (
                    !data.targetRole ||
                    !Array.isArray(data.skillGaps)
                ) {
                    throw new Error(
                        "Invalid career roadmap data."
                    );
                }

                const response = await fetch(
                    "http://localhost:8000/career/roadmap",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            target_role:
                                data.targetRole,
                            skill_gaps:
                                data.skillGaps,
                        }),
                    }
                );

                if (!response.ok) {
                    const errorText =
                        await response.text();

                    console.error(
                        "Roadmap API error:",
                        errorText
                    );

                    throw new Error(
                        "Failed to generate career roadmap."
                    );
                }

                const result =
                    await response.json();

                setRoadmap(result);
            } catch (err) {
                console.error(
                    "Career roadmap error:",
                    err
                );

                setError(
                    err.message ||
                    "Unable to load career roadmap."
                );
            } finally {
                setLoading(false);
            }
        };

        loadRoadmap();
    }, []);

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
                    flexDirection: "column",
                    gap: "15px",
                }}
            >
                <div
                    style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        border:
                            "4px solid rgba(85,217,155,0.15)",
                        borderTop:
                            "4px solid #55d99b",
                        animation:
                            "roadmapSpin 0.8s linear infinite",
                    }}
                />

                <p
                    style={{
                        color: "#8d9b95",
                        margin: 0,
                    }}
                >
                    Building your personalized roadmap...
                </p>

                <style>
                    {`
                        @keyframes roadmapSpin {
                            to {
                                transform: rotate(360deg);
                            }
                        }
                    `}
                </style>
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "#07100d",
                    color: "#f5f7f6",
                    padding: "40px",
                }}
            >
                <button
                    onClick={() =>
                        navigate("/career-readiness")
                    }
                    style={{
                        padding: "11px 16px",
                        borderRadius: "10px",
                        border:
                            "1px solid rgba(255,255,255,0.12)",
                        background: "#0c1814",
                        color: "#fff",
                        cursor: "pointer",
                    }}
                >
                    ← Back to Career Readiness
                </button>

                <div
                    style={{
                        maxWidth: "700px",
                        margin: "80px auto",
                        padding: "30px",
                        borderRadius: "18px",
                        border:
                            "1px solid rgba(255,90,90,0.2)",
                        background: "#0c1814",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            fontSize: "40px",
                            marginBottom: "15px",
                        }}
                    >
                        ⚠️
                    </div>

                    <h2
                        style={{
                            margin: 0,
                            fontSize: "23px",
                        }}
                    >
                        Roadmap Unavailable
                    </h2>

                    <p
                        style={{
                            color: "#8d9b95",
                            marginTop: "12px",
                            lineHeight: "1.6",
                        }}
                    >
                        {error}
                    </p>

                    <button
                        onClick={() =>
                            navigate("/career-readiness")
                        }
                        style={{
                            marginTop: "15px",
                            padding: "12px 18px",
                            border: "none",
                            borderRadius: "10px",
                            background: "#55d99b",
                            color: "#07100d",
                            fontWeight: "700",
                            cursor: "pointer",
                        }}
                    >
                        Analyze Career Readiness
                    </button>
                </div>
            </div>
        );
    }

    const items = roadmap?.roadmap || [];

    return (
        <div
            style={{
                minHeight: "100vh",
                padding: "35px",
                background: "#07100d",
                color: "#f5f7f6",
            }}
        >
            {/* HEADER */}

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    gap: "25px",
                    marginBottom: "35px",
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <div
                        style={{
                            color: "#55d99b",
                            fontSize: "11px",
                            fontWeight: "700",
                            letterSpacing: "3px",
                            marginBottom: "8px",
                        }}
                    >
                        AI CAREER INTELLIGENCE
                    </div>

                    <h1
                        style={{
                            margin: 0,
                            fontSize: "34px",
                        }}
                    >
                        Personalized Career Roadmap
                    </h1>

                    <p
                        style={{
                            maxWidth: "700px",
                            color: "#9ba9a4",
                            lineHeight: "1.6",
                            marginTop: "12px",
                        }}
                    >
                        A step-by-step plan generated from
                        your actual skill gaps for your
                        selected career role.
                    </p>
                </div>

                <button
                    onClick={() =>
                        navigate("/career-readiness")
                    }
                    style={{
                        padding: "12px 17px",
                        borderRadius: "10px",
                        border:
                            "1px solid rgba(85,217,155,0.25)",
                        background: "#0c1814",
                        color: "#55d99b",
                        cursor: "pointer",
                        fontWeight: "600",
                    }}
                >
                    ← Career Readiness
                </button>
            </div>

            {/* TARGET ROLE */}

            <div
                style={{
                    padding: "22px 25px",
                    marginBottom: "28px",
                    border:
                        "1px solid rgba(85,217,155,0.18)",
                    borderRadius: "18px",
                    background: "#0c1814",
                }}
            >
                <div
                    style={{
                        color: "#7e9189",
                        fontSize: "11px",
                        fontWeight: "700",
                        letterSpacing: "2px",
                        marginBottom: "8px",
                    }}
                >
                    TARGET CAREER
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "20px",
                        flexWrap: "wrap",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "24px",
                        }}
                    >
                        {roadmap?.target_role}
                    </h2>

                    <div
                        style={{
                            padding: "9px 14px",
                            borderRadius: "20px",
                            background:
                                "rgba(85,217,155,0.08)",
                            color: "#55d99b",
                            fontSize: "13px",
                        }}
                    >
                        {roadmap?.total_gaps || 0} skill gaps
                    </div>
                </div>
            </div>

            {/* ROADMAP */}

            {items.length === 0 ? (
                <div
                    style={{
                        padding: "45px 30px",
                        textAlign: "center",
                        border:
                            "1px solid rgba(85,217,155,0.16)",
                        borderRadius: "18px",
                        background: "#0c1814",
                    }}
                >
                    <div
                        style={{
                            fontSize: "40px",
                            marginBottom: "12px",
                        }}
                    >
                        🎉
                    </div>

                    <h2 style={{ margin: 0 }}>
                        No Skill Gaps Found
                    </h2>

                    <p
                        style={{
                            color: "#8d9b95",
                            marginTop: "10px",
                        }}
                    >
                        Your current profile does not
                        require a learning roadmap for
                        this role.
                    </p>
                </div>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "18px",
                    }}
                >
                    {items.map((item, index) => (
                        <div
                            key={`${item.skill}-${index}`}
                            style={{
                                position: "relative",
                                padding: "25px",
                                border:
                                    "1px solid rgba(85,217,155,0.16)",
                                borderRadius: "18px",
                                background: "#0c1814",
                            }}
                        >
                            {/* NUMBER */}

                            <div
                                style={{
                                    position: "absolute",
                                    top: "22px",
                                    left: "-12px",
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "50%",
                                    background: "#55d99b",
                                    color: "#07100d",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent:
                                        "center",
                                    fontWeight: "800",
                                    fontSize: "13px",
                                }}
                            >
                                {item.order}
                            </div>

                            {/* TITLE */}

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent:
                                        "space-between",
                                    alignItems: "flex-start",
                                    gap: "20px",
                                    flexWrap: "wrap",
                                    marginLeft: "12px",
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            color: "#55d99b",
                                            fontSize: "11px",
                                            fontWeight: "700",
                                            letterSpacing:
                                                "2px",
                                            marginBottom:
                                                "7px",
                                        }}
                                    >
                                        SKILL {item.order}
                                    </div>

                                    <h2
                                        style={{
                                            margin: 0,
                                            fontSize: "22px",
                                        }}
                                    >
                                        {item.title}
                                    </h2>

                                    <p
                                        style={{
                                            color: "#8d9b95",
                                            lineHeight:
                                                "1.6",
                                            marginTop:
                                                "9px",
                                            maxWidth:
                                                "700px",
                                        }}
                                    >
                                        {
                                            item.description
                                        }
                                    </p>
                                </div>

                                <span
                                    style={{
                                        ...priorityStyle(
                                            item.priority
                                        ),
                                        padding:
                                            "6px 11px",
                                        borderRadius:
                                            "20px",
                                        fontSize: "11px",
                                        fontWeight: "700",
                                        textTransform:
                                            "uppercase",
                                    }}
                                >
                                    {item.priority} Priority
                                </span>
                            </div>

                            {/* LEVELS */}

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fit, minmax(150px, 1fr))",
                                    gap: "12px",
                                    marginTop: "20px",
                                }}
                            >
                                <div
                                    style={{
                                        padding: "14px",
                                        borderRadius:
                                            "12px",
                                        background:
                                            "#09130f",
                                    }}
                                >
                                    <div
                                        style={{
                                            color:
                                                "#71817a",
                                            fontSize:
                                                "11px",
                                        }}
                                    >
                                        CURRENT LEVEL
                                    </div>

                                    <strong
                                        style={{
                                            display:
                                                "block",
                                            marginTop:
                                                "5px",
                                            fontSize:
                                                "20px",
                                        }}
                                    >
                                        {
                                            item.current_level
                                        }
                                    </strong>
                                </div>

                                <div
                                    style={{
                                        padding: "14px",
                                        borderRadius:
                                            "12px",
                                        background:
                                            "#09130f",
                                    }}
                                >
                                    <div
                                        style={{
                                            color:
                                                "#71817a",
                                            fontSize:
                                                "11px",
                                        }}
                                    >
                                        TARGET LEVEL
                                    </div>

                                    <strong
                                        style={{
                                            display:
                                                "block",
                                            marginTop:
                                                "5px",
                                            fontSize:
                                                "20px",
                                            color:
                                                "#55d99b",
                                        }}
                                    >
                                        {
                                            item.target_level
                                        }
                                    </strong>
                                </div>

                                <div
                                    style={{
                                        padding: "14px",
                                        borderRadius:
                                            "12px",
                                        background:
                                            "#09130f",
                                    }}
                                >
                                    <div
                                        style={{
                                            color:
                                                "#71817a",
                                            fontSize:
                                                "11px",
                                        }}
                                    >
                                        SKILL GAP
                                    </div>

                                    <strong
                                        style={{
                                            display:
                                                "block",
                                            marginTop:
                                                "5px",
                                            fontSize:
                                                "20px",
                                            color:
                                                "#ff9a9a",
                                        }}
                                    >
                                        {item.gap}
                                    </strong>
                                </div>
                            </div>

                            {/* LEARNING CONTENT */}

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fit, minmax(260px, 1fr))",
                                    gap: "18px",
                                    marginTop: "22px",
                                }}
                            >
                                {/* LEARN */}

                                <div
                                    style={{
                                        padding: "20px",
                                        borderRadius:
                                            "14px",
                                        background:
                                            "#09130f",
                                        border:
                                            "1px solid rgba(255,255,255,0.05)",
                                    }}
                                >
                                    <h3
                                        style={{
                                            marginTop: 0,
                                            fontSize: "16px",
                                        }}
                                    >
                                        📚 Learn
                                    </h3>

                                    <ul
                                        style={{
                                            margin: 0,
                                            paddingLeft:
                                                "20px",
                                            color:
                                                "#a7b2ae",
                                            lineHeight:
                                                "1.8",
                                        }}
                                    >
                                        {(
                                            item.topics ||
                                            []
                                        ).map(
                                            (
                                                topic,
                                                topicIndex
                                            ) => (
                                                <li
                                                    key={
                                                        topicIndex
                                                    }
                                                >
                                                    {topic}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>

                                {/* PRACTICE */}

                                <div
                                    style={{
                                        padding: "20px",
                                        borderRadius:
                                            "14px",
                                        background:
                                            "#09130f",
                                        border:
                                            "1px solid rgba(255,255,255,0.05)",
                                    }}
                                >
                                    <h3
                                        style={{
                                            marginTop: 0,
                                            fontSize: "16px",
                                        }}
                                    >
                                        🛠️ Practice
                                    </h3>

                                    <ul
                                        style={{
                                            margin: 0,
                                            paddingLeft:
                                                "20px",
                                            color:
                                                "#a7b2ae",
                                            lineHeight:
                                                "1.8",
                                        }}
                                    >
                                        {(
                                            item.practice_tasks ||
                                            []
                                        ).map(
                                            (
                                                task,
                                                taskIndex
                                            ) => (
                                                <li
                                                    key={
                                                        taskIndex
                                                    }
                                                >
                                                    {task}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>

                                {/* ASSESS */}

                                <div
                                    style={{
                                        padding: "20px",
                                        borderRadius:
                                            "14px",
                                        background:
                                            "#09130f",
                                        border:
                                            "1px solid rgba(255,255,255,0.05)",
                                    }}
                                >
                                    <h3
                                        style={{
                                            marginTop: 0,
                                            fontSize: "16px",
                                        }}
                                    >
                                        🧪 Assess
                                    </h3>

                                    <p
                                        style={{
                                            color:
                                                "#a7b2ae",
                                            lineHeight:
                                                "1.6",
                                        }}
                                    >
                                        Complete the{" "}
                                        <strong
                                            style={{
                                                color:
                                                    "#fff",
                                            }}
                                        >
                                            {
                                                item.assessment
                                            }
                                        </strong>{" "}
                                        after practicing
                                        this skill.
                                    </p>

                                    <div
                                        style={{
                                            marginTop:
                                                "18px",
                                            height: "7px",
                                            borderRadius:
                                                "10px",
                                            background:
                                                "#17241e",
                                            overflow:
                                                "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${item.progress || 0}%`,
                                                height: "100%",
                                                background:
                                                    "#55d99b",
                                                borderRadius:
                                                    "10px",
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            const role = roadmap?.target_role || "";
                                            const skill = item.skill || "";

                                            navigate(
                                                `/career-assessment?mode=career&role=${encodeURIComponent(
                                                    role
                                                )}&skill=${encodeURIComponent(
                                                    skill
                                                )}`
                                            );
                                        }}
                                        style={{
                                            marginTop: "22px",
                                            padding: "14px 20px",
                                            border: "none",
                                            borderRadius: "12px",
                                            background: "#55d99b",
                                            color: "#07100d",
                                            fontWeight: "700",
                                            fontSize: "14px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Start Assessment →
                                    </button>

                                    <div
                                        style={{
                                            marginTop:
                                                "8px",
                                            color:
                                                "#71817a",
                                            fontSize:
                                                "12px",
                                        }}
                                    >
                                        Progress:{" "}
                                        {item.progress ||
                                            0}
                                        %
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CareerRoadmapPage;