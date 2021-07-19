import type { ValidationReport } from '../../../../use-cases/schematron';
import type { Role } from './state';
import type { PresenterConfig } from '..';

export const reset = ({ state }: PresenterConfig) => {
  if (state.report.matches('VALIDATED')) {
    state.report.send('RESET');
  }
};

export const setXmlContents = async (
  { actions, state, effects }: PresenterConfig,
  options: { fileName: string; xmlContents: string },
) => {
  actions.report.reset();
  if (
    state.report
      .send('PROCESSING_STRING', { fileName: options.fileName })
      .matches('PROCESSING')
  ) {
    return effects.useCases
      .validateSSP(options.xmlContents)
      .then(validationReport =>
        actions.report.setValidationReport({
          validationReport,
          xmlText: options.xmlContents,
        }),
      )
      .then(actions.report.annotateXml)
      .catch(actions.report.setProcessingError);
  }
};

export const setXmlUrl = async (
  { actions, effects, state }: PresenterConfig,
  xmlFileUrl: string,
) => {
  actions.report.reset();
  if (
    state.report.send('PROCESSING_URL', { xmlFileUrl }).matches('PROCESSING')
  ) {
    return effects.useCases
      .validateSSPUrl(xmlFileUrl)
      .then(actions.report.setValidationReport)
      .then(actions.report.annotateXml)
      .catch(actions.report.setProcessingError);
  }
};

export const annotateXml = async ({ effects, state }: PresenterConfig) => {
  if (state.report.current === 'VALIDATED') {
    const annotatedSSP = await effects.useCases.annotateXML({
      xmlString: state.report.xmlText,
      annotations: state.report.validationReport.failedAsserts.map(assert => {
        return {
          uniqueId: assert.uniqueId,
          xpath: assert.location,
        };
      }),
    });
    state.report.annotatedSSP = annotatedSSP;
  }
};

export const setProcessingError = (
  { state }: PresenterConfig,
  errorMessage: string,
) => {
  if (state.report.matches('PROCESSING')) {
    state.report.send('PROCESSING_ERROR', { errorMessage });
  }
};

export const setValidationReport = (
  { state }: PresenterConfig,
  {
    validationReport,
    xmlText,
  }: {
    validationReport: ValidationReport;
    xmlText: string;
  },
) => {
  if (state.report.matches('PROCESSING')) {
    state.report.send('VALIDATED', { validationReport, xmlText });
  }
};

export const setFilterRole = ({ state }: PresenterConfig, filter: Role) => {
  if (state.report.current === 'VALIDATED') {
    state.report.filter.role = filter;
  }
};

export const setFilterText = ({ state }: PresenterConfig, text: string) => {
  if (state.report.current === 'VALIDATED') {
    state.report.filter.text = text;
  }
};
