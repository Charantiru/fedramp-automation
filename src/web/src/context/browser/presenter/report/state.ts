import { derived, Statemachine, statemachine } from 'overmind';

import type {
  ValidationAssert,
  ValidationReport,
} from '../../../../use-cases/schematron';

export type Role = string;

type States =
  | {
      current: 'UNLOADED';
    }
  | {
      current: 'PROCESSING';
      message: string;
    }
  | {
      current: 'PROCESSING_ERROR';
      errorMessage: string;
    }
  | {
      current: 'VALIDATED';
      filter: {
        role: Role;
        text: string;
      };
      roles: Role[];
      validationReport: ValidationReport;
      xmlText: string;
      annotatedSSP: string;
      filterRoles: Role[];
      visibleAssertions: ValidationAssert[];
    };

type BaseState = {};

type Events =
  | {
      type: 'RESET';
    }
  | {
      type: 'PROCESSING_URL';
      data: {
        xmlFileUrl: string;
      };
    }
  | {
      type: 'PROCESSING_STRING';
      data: {
        fileName: string;
      };
    }
  | {
      type: 'PROCESSING_ERROR';
      data: {
        errorMessage: string;
      };
    }
  | {
      type: 'VALIDATED';
      data: {
        validationReport: ValidationReport;
        xmlText: string;
      };
    };

export type ReportMachine = Statemachine<States, Events, BaseState>;

export const reportMachine = statemachine<States, Events, BaseState>({
  PROCESSING_ERROR: {
    RESET: () => {
      return {
        current: 'UNLOADED',
      };
    },
  },
  VALIDATED: {
    RESET: () => {
      return {
        current: 'UNLOADED',
      };
    },
  },
  UNLOADED: {
    PROCESSING_URL: ({ xmlFileUrl }) => {
      return {
        current: 'PROCESSING',
        message: `Processing ${xmlFileUrl}...`,
      };
    },
    PROCESSING_STRING: ({ fileName }) => {
      return {
        current: 'PROCESSING',
        message: `Processing local file...`,
      };
    },
    PROCESSING_ERROR: () => {},
  },
  PROCESSING: {
    PROCESSING_ERROR: ({ errorMessage }) => {
      return {
        current: 'PROCESSING_ERROR',
        errorMessage,
      };
    },
    VALIDATED: ({ validationReport, xmlText }) => {
      return {
        current: 'VALIDATED',
        validationReport,
        annotatedSSP: '',
        xmlText,
        filter: {
          role: 'all',
          text: '',
        },
        roles: [
          'all',
          ...Array.from(
            new Set(
              validationReport.failedAsserts.map(assert => assert.role || ''),
            ),
          ).sort(),
        ],
        filterRoles: derived((state: ReportMachine) => {
          const validatedState = state.matches('VALIDATED');
          if (!validatedState) {
            return [];
          }
          switch (validatedState.filter.role) {
            case 'all':
              return validatedState.roles;
            default:
              return [validatedState.filter.role];
          }
        }),
        visibleAssertions: derived((state: ReportMachine) => {
          const validatedState = state.matches('VALIDATED');
          if (!validatedState) {
            return [];
          }
          let assertions = validatedState.validationReport.failedAsserts.filter(
            (assertion: ValidationAssert) => {
              return validatedState.filterRoles.includes(assertion.role || '');
            },
          );
          if (validatedState.filter.text.length > 0) {
            assertions = assertions.filter(assertion => {
              const allText = Object.values(assertion).join('\n').toLowerCase();
              return allText.includes(validatedState.filter.text.toLowerCase());
            });
          }
          return assertions;
        }),
      };
    },
  },
});

export const createReportMachine = () => {
  return reportMachine.create({ current: 'UNLOADED' }, {});
};
