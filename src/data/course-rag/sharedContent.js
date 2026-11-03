const sourceResourceDescriptions = {
  Video: 'Video learning resource supporting this curriculum topic.',
  Download: 'Downloadable learning material supporting this curriculum topic.',
  Quiz: 'Knowledge check used to review understanding of this curriculum topic.',
  Lecture: 'Self-paced learning content covering this curriculum topic.',
  Resource: 'Learning resource connected to this curriculum topic.',
}

export const sharedSourceSections = {
  advantages: [
    ['ph-certificate', 'Accredited study pathways', 'Programme pages describe qualifications delivered with relevant academic and awarding partners. The exact award is confirmed before enrolment.'],
    ['ph-list-checks', 'Applied assessment', 'Learning is designed around practical assignments and activities that connect study with professional decisions.'],
    ['ph-credit-card', 'Flexible payment options', 'Eligible learners can request the current instalment structure and any available scholarship information.'],
    ['ph-device-mobile', 'Flexible online learning', 'Recorded resources and scheduled online sessions support study alongside professional commitments.'],
    ['ph-graduation-cap', 'International learner community', 'Online access connects learners with programmes designed for participation across countries and professional backgrounds.'],
    ['ph-books', 'Digital study resources', 'Programme learning is supported by online course materials and wider research resources.'],
  ],
  library: 'The source programme pages provide enrolled learners with a complimentary digital learning-resource collection containing articles, journals and supporting research material.',
  libraryMetric: '31M+',
  libraryMetricLabel: 'articles and journals referenced by the source programme pages',
  gettingStartedIntro: 'The recorded application journey moves from account creation and document review through enrolment, study, assessment and award completion.',
  gettingStarted: [
    { title: 'Create an account', description: 'Register on the learning platform and provide the initial application information.' },
    { title: 'Upload supporting documents', description: 'Provide the academic or professional records requested for admissions review.' },
    { title: 'Receive an admissions decision', description: 'The admissions team reviews the application and confirms the appropriate programme pathway.' },
    { title: 'Confirm tuition arrangements', description: 'Accept the offer and complete the agreed payment step to confirm enrolment.' },
    { title: 'Attend lectures and live sessions', description: 'Use the learner portal for recorded content and join scheduled online classes where applicable.' },
    { title: 'Complete assessments', description: 'Submit the assignments, projects or quizzes required by the programme.' },
    { title: 'Receive the applicable award', description: 'After successful completion, receive the programme certificate and related academic documentation.' },
  ],
  certificateDetails: [
    ['ph-certificate', 'Programme award', 'Successful learners receive the certificate or degree applicable to their selected programme and academic pathway.'],
    ['ph-books', 'Applied curriculum', 'The award follows completion of the recorded learning modules and required assessments.'],
    ['ph-briefcase', 'Study alongside work', 'Flexible delivery supports learners completing the programme without necessarily leaving employment or their home country.'],
  ],
  testimonials: [
    ['Spartaco G.', 'The learning experience introduced approaches that could be applied with colleagues in professional practice.'],
    ['Ronald E.', 'Online delivery made it possible to pursue a long-standing study goal from outside the United Kingdom.'],
    ['Vanessa M.', 'The learning material used useful examples and explained the main ideas clearly.'],
  ],
}

const hasPresence = (source, id) => Boolean(source?.sectionPresence?.[id])
const gssBrandText = (value) => typeof value === 'string' ? value.replace(/Metropolitan School of Business & Management|MSBM/g, 'GSS') : value
const moduleTitle = (module) => Array.isArray(module) ? module[0] : module?.title

export function describeRecordedModules(modules = []) {
  return modules.map((module) => ({
    ...module,
    lessons: (module.lessons || []).map((lesson) => ({
      ...lesson,
      description: lesson.description || sourceResourceDescriptions[lesson.type] || sourceResourceDescriptions.Resource,
      descriptionScope: lesson.description ? 'course-source' : 'shared-resource-type',
    })),
  }))
}

export function derivedCourseDetails(course, modules = []) {
  if (course.courseDetails) return course.courseDetails
  const names = modules.map(moduleTitle).filter(Boolean)
  if (!names.length) return ''
  const featured = names.slice(0, 5).join(', ')
  const scope = course.modulesIndicative ? 'editorial curriculum themes' : 'recorded curriculum sections'
  const status = course.modulesIndicative ? 'The current pathway outline includes' : 'The published curriculum includes'
  return `${course.title} is organised around ${modules.length} ${scope}. ${status} ${featured}${names.length > 5 ? ', and additional specialist or research study' : ''}. Module descriptions and available lesson resources are listed in the curriculum section below.`
}

export function derivedOutcomes(modules = []) {
  return modules
    .map(moduleTitle)
    .filter((title) => title && !/assignment|guideline|orientation/i.test(title))
    .slice(0, 10)
    .map((title) => `Apply the concepts and professional practices covered in ${title.toLowerCase()}.`)
}

export function applySharedSourceSections(course, source) {
  const modules = describeRecordedModules(course.modules || source?.modules || [])
  const courseDetails = derivedCourseDetails(course, modules)
  const outcomes = course.outcomes?.length ? course.outcomes : derivedOutcomes(modules)
  return {
    ...course,
    modules,
    courseDetails,
    courseDetailsStatus: course.courseDetails ? 'recorded' : courseDetails ? 'derived-from-recorded-curriculum' : 'pending',
    outcomes,
    outcomesStatus: course.outcomes?.length ? 'recorded' : outcomes.length ? 'derived-from-recorded-curriculum' : 'pending',
    advantages: course.advantages || (hasPresence(source, 'about') ? sharedSourceSections.advantages : undefined),
    library: course.library || (hasPresence(source, 'library') ? sharedSourceSections.library : undefined),
    libraryMetric: course.libraryMetric || (hasPresence(source, 'library') ? sharedSourceSections.libraryMetric : undefined),
    libraryMetricLabel: course.libraryMetricLabel || (hasPresence(source, 'library') ? sharedSourceSections.libraryMetricLabel : undefined),
    gettingStartedIntro: course.gettingStartedIntro || (hasPresence(source, 'gettingStarted') ? sharedSourceSections.gettingStartedIntro : undefined),
    gettingStarted: course.gettingStarted || (hasPresence(source, 'gettingStarted') ? sharedSourceSections.gettingStarted : undefined),
    certificateDetails: course.certificateDetails || (hasPresence(source, 'certificate') ? sharedSourceSections.certificateDetails : undefined),
    testimonials: course.testimonials || (hasPresence(source, 'testimonials') ? sharedSourceSections.testimonials : undefined),
    sharedSectionScope: 'source-page-template',
  }
}

export function applyRetainedEnrichment(course, enrichment) {
  if (!enrichment || enrichment.status !== 'retained_snapshot_requires_independent_review') return course
  const libraryMetric = enrichment.library?.metric ? `${Number(enrichment.library.metric).toLocaleString('en-GB')}+` : course.libraryMetric
  return {
    ...course,
    courseDetails: gssBrandText(enrichment.courseDetails) || course.courseDetails,
    courseDetailsStatus: enrichment.courseDetails ? 'retained-source-snapshot' : course.courseDetailsStatus,
    outcomes: enrichment.outcomes?.length ? enrichment.outcomes.map(gssBrandText) : course.outcomes,
    outcomesStatus: enrichment.outcomes?.length ? 'retained-source-snapshot' : course.outcomesStatus,
    progression: enrichment.progression?.status === 'observed' ? enrichment.progression.text : undefined,
    progressionStatus: enrichment.progression?.status || course.progressionStatus,
    progressionReason: enrichment.progression?.reason || course.progressionReason,
    modules: enrichment.modules?.length ? enrichment.modules.map((module) => ({
      ...module,
      title: gssBrandText(module.title),
      summary: gssBrandText(module.summary),
      description: gssBrandText(module.description),
      lessons: (module.lessons || []).map((lesson) => ({ ...lesson, title: gssBrandText(lesson.title), description: gssBrandText(lesson.description) })),
    })) : course.modules,
    advantages: enrichment.about?.advantages?.length
      ? enrichment.about.advantages.map((title, index) => [sharedSourceSections.advantages[index % sharedSourceSections.advantages.length][0], gssBrandText(title), gssBrandText(enrichment.about.summary)])
      : course.advantages,
    library: gssBrandText(enrichment.library?.summary) || course.library,
    libraryMetric,
    libraryMetricLabel: enrichment.library?.metric ? 'articles and journals referenced by the retained source snapshot' : course.libraryMetricLabel,
    gettingStartedIntro: enrichment.gettingStarted?.length ? 'The retained source snapshot records the following application and study journey.' : course.gettingStartedIntro,
    gettingStarted: enrichment.gettingStarted?.length ? enrichment.gettingStarted : course.gettingStarted,
    certificateDetails: enrichment.certificate?.summary ? [['ph-certificate', 'Programme award', gssBrandText(enrichment.certificate.summary)]] : course.certificateDetails,
    retainedEvidence: enrichment.sourceEvidence,
    sourceCoverage: 'partial',
  }
}

export function applyOriginalGssSections(course) {
  const modules = course.modules || []
  const outcomes = course.outcomes?.length ? course.outcomes : derivedOutcomes(modules)
  return {
    ...course,
    courseDetails: course.courseDetails || derivedCourseDetails(course, modules),
    courseDetailsStatus: course.courseDetails ? 'recorded' : 'gss-editorial',
    outcomes,
    outcomesStatus: course.outcomes?.length ? 'recorded' : outcomes.length ? 'gss-editorial' : 'pending',
    entry: course.entry || ['Applicants should provide the academic and professional information requested during application. The admissions team confirms suitability for the selected level before enrolment.'],
    accreditation: course.accreditation || 'Award, accreditation and partner information is confirmed for the selected programme before enrolment.',
    workshops: course.workshops || 'Scheduled support sessions and workshops are delivered online where included in the programme.',
    visa: course.visa || 'Online study does not normally require a study visa. Any optional campus activity is confirmed separately.',
    progression: course.progression || 'Learners can discuss the next suitable GSS study level or specialist pathway with an admissions advisor after completing this programme.',
    advantages: course.advantages || sharedSourceSections.advantages,
    library: course.library || 'Learners use the digital course materials and research resources provided for their selected programme.',
    gettingStartedIntro: course.gettingStartedIntro || sharedSourceSections.gettingStartedIntro,
    gettingStarted: course.gettingStarted || sharedSourceSections.gettingStarted,
    certificateDetails: course.certificateDetails || sharedSourceSections.certificateDetails,
    testimonials: course.testimonials || sharedSourceSections.testimonials,
    sharedSectionScope: 'gss-editorial',
  }
}
