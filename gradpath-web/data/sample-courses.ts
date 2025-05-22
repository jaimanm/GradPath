import type { Course } from "@/lib/types"

export const sampleCourses: Course[] = [
  {
    id: "MATH140",
    name: "Calculus I",
    semester: 1,
    prerequisites: [],
    completed: false,
    credits: 4,
    description:
      "Introduction to calculus, including functions, limits, continuity, derivatives and applications of the derivative, sketching of graphs of functions, introduction to definite and indefinite integrals, and calculation of area.",
  },
  {
    id: "MATH141",
    name: "Calculus II",
    semester: 1,
    prerequisites: ["MATH140"],
    completed: false,
    credits: 4,
    description:
      "Continuation of MATH140, including techniques of integration, improper integrals, applications of integration (such as volumes, work, arc length, moments), inverse functions, exponential and logarithmic functions, sequences and series.",
  },
  {
    id: "CMSC131",
    name: "Object-Oriented Programming I",
    semester: 1,
    prerequisites: [],
    completed: false,
    credits: 4,
    description:
      "Introduction to programming and computer science. Emphasizes understanding and implementation of applications using object-oriented techniques.",
  },
  {
    id: "CMSC132",
    name: "Object-Oriented Programming II",
    semester: 1,
    prerequisites: ["CMSC131"],
    completed: false,
    credits: 4,
    description:
      "Introduction to use of computers to solve problems using software engineering principles. Design, build, test, and debug medium-size software systems.",
  },
  {
    id: "STAT400",
    name: "Applied Probability and Statistics",
    semester: 2,
    prerequisites: ["MATH141"],
    completed: false,
    credits: 3,
    description:
      "Random variables, standard distributions, moments, law of large numbers and central limit theorem. Sampling methods, estimation of parameters, testing of hypotheses.",
  },
  {
    id: "CMSC250",
    name: "Discrete Structures",
    semester: 2,
    prerequisites: ["CMSC131", "MATH141"],
    completed: false,
    credits: 4,
    description:
      "Fundamental mathematical concepts related to computer science, including finite and infinite sets, relations, functions, and propositional logic.",
  },
  {
    id: "CMSC216",
    name: "Introduction to Computer Systems",
    semester: 3,
    prerequisites: ["CMSC132"],
    completed: false,
    credits: 4,
    description:
      "Introduction to the interaction between user programs and the operating system/hardware. Major topics include C programming, introductory systems programming, and assembly language.",
  },
  {
    id: "MATH461",
    name: "Linear Algebra for Scientists and Engineers",
    semester: 3,
    prerequisites: ["MATH141", "CMSC250"],
    completed: false,
    credits: 3,
    description:
      "Basic concepts of linear algebra: vector spaces, applications to line and plane geometry, linear equations and matrices, similar matrices, linear transformations, eigenvalues, determinants and quadratic forms.",
  },
  {
    id: "CMSC320",
    name: "Introduction to Data Science",
    semester: 3,
    prerequisites: ["MATH140", "STAT400"],
    completed: false,
    credits: 3,
    description:
      "An introduction to the data science pipeline, i.e., the end-to-end process of going from unstructured, messy data to knowledge and actionable insights.",
  },
  {
    id: "CMSC330",
    name: "Organization of Programming Languages",
    semester: 4,
    prerequisites: ["CMSC216", "MATH461"],
    completed: false,
    credits: 3,
    description: "A study of programming languages, including their syntax, semantics, and implementation.",
  },
  {
    id: "CMSC351",
    name: "Algorithms",
    semester: 4,
    prerequisites: ["CMSC216", "MATH461"],
    completed: false,
    credits: 3,
    description:
      "A systematic study of the complexity of some elementary algorithms related to sorting, graphs and trees, and combinatorics. Algorithms are analyzed using mathematical techniques to solve recurrences and summations.",
  },
  {
    id: "MATH401",
    name: "Applications of Linear Algebra",
    semester: 5,
    prerequisites: ["MATH461", "CMSC330", "CMSC351"],
    completed: false,
    credits: 3,
    description:
      "Various applications of linear algebra: theory of finite games, linear programming, matrix methods as applied to finite Markov chains, random walk, incidence matrices, graphs and directed graphs, networks, transportation problems.",
  },
  {
    id: "CMSC422",
    name: "Introduction to Machine Learning",
    semester: 5,
    prerequisites: ["CMSC330", "CMSC351"],
    completed: false,
    credits: 3,
    description:
      "Machine Learning studies representations and algorithms that allow machines to improve their performance on a task from experience. This course introduces the fundamental concepts and techniques in machine learning.",
  },
  {
    id: "CMSC426",
    name: "Computer Vision",
    semester: 5,
    prerequisites: ["CMSC330", "CMSC351", "MATH461"],
    completed: false,
    credits: 3,
    description:
      "An introduction to basic concepts and techniques in computer vision. This includes low-level operations such as image filtering and edge detection, 3D reconstruction of scenes using stereo and structure from motion, and object detection, recognition and classification.",
  },
  {
    id: "CMSC470",
    name: "Natural Language Processing",
    semester: 5,
    prerequisites: ["CMSC320", "CMSC330", "CMSC351", "MATH461"],
    completed: false,
    credits: 3,
    description:
      "An introduction to natural language processing. Topics include syntactic and semantic parsing, discourse processing, machine translation, and statistical methods in speech recognition.",
  },
  {
    id: "CMSC460",
    name: "Computational Methods",
    semester: 6,
    prerequisites: ["CMSC422"],
    completed: false,
    credits: 3,
    description:
      "Basic computational methods for interpolation, least squares, approximation, numerical quadrature, numerical solution of polynomial and transcendental equations, systems of linear equations and initial value problems for ordinary differential equations.",
  },
  {
    id: "CMSC435",
    name: "Software Engineering",
    semester: 6,
    prerequisites: ["CMSC426"],
    completed: false,
    credits: 3,
    description:
      "State-of-the-art techniques in software design and development. Laboratory experience in applying the techniques covered. Structured design, structured programming, top-down design and development, segmentation and modularization techniques, iterative enhancement, design and code inspection techniques, correctness, and chief-programmer teams.",
  },
]

export const coursePrerequisites: Record<string, string[]> = {
  MATH141: ["MATH140"],
  CMSC132: ["CMSC131"],
  STAT400: ["MATH141"],
  CMSC250: ["CMSC131", "MATH141"],
  CMSC216: ["CMSC132"],
  MATH461: ["MATH141", "CMSC250"],
  CMSC320: ["MATH140", "STAT400"],
  CMSC330: ["CMSC216", "MATH461"],
  CMSC351: ["CMSC216", "MATH461"],
  MATH401: ["MATH461", "CMSC330", "CMSC351"],
  CMSC422: ["CMSC330", "CMSC351"],
  CMSC426: ["CMSC330", "CMSC351", "MATH461"],
  CMSC470: ["CMSC320", "CMSC330", "CMSC351", "MATH461"],
  CMSC460: ["CMSC422"],
  CMSC435: ["CMSC426"],
}
