export interface ValidityItemResult {
  components: {
    n: number;
    sumX?: number;
    sumY?: number;
    sumXY?: number;
    sumX2?: number;
    sumY2?: number;
    sumD2?: number;
  };
  rHitung: number | null;
  rTabel: number | null;
  status: string;
  isNegative: boolean;
  narrative: string;
  latexSub: string | null;
  latexSubCopy: string | null;
}

export interface ValidityResponse {
  ok: boolean;
  error?: string;
  itemResults?: Record<string, ValidityItemResult>;
  totalTested?: number;
  validCount?: number;
  invalidCount?: number;
  df?: number;
  rTabel?: number | null;
  method?: string;
  methodLabel?: string;
  technique?: string;
  techniqueLabel?: string;
}

export interface ReliabilityResponse {
  ok: boolean;
  error?: string;
  detailed?: {
    k: number;
    n: number;
    alpha: number;
    sumItemVariances: number;
    totalVariance: number;
    itemDetail: Record<string, { mean: number; variance: number; sum: number }>;
  };
  interp?: { level: string; css: string };
  narrative?: string;
}

export interface RegressionResponse {
  ok: boolean;
  error?: string;
  regression?: {
    n: number;
    k: number;
    xNames: string[];
    coefficients: Record<string, number>;
    standardErrors: Record<string, number>;
    tValues: Record<string, number | null>;
    dfRegression: number;
    dfResidual: number;
    dfTotal: number;
    ssRegression: number;
    ssResidual: number;
    ssTotal: number;
    msRegression: number | null;
    msResidual: number | null;
    rSquared: number | null;
    adjustedRSquared: number | null;
    fHitung: number | null;
  };
  fTabel?: number | null;
  fStatus?: string;
  coefficientResults?: Record<
    string,
    {
      name: string;
      coef: number;
      se: number | null;
      tHitung: number | null;
      tTabel: number | null;
      status: string;
      narrative: string | null;
    }
  >;
  narrative?: string;
}

export interface NormalityItemResult {
  n: number;
  W?: number;
  D?: number;
  dPlus?: number;
  dMinus?: number;
  pValue: number | null;
  mean?: number;
  sd?: number;
  isNormal: boolean;
  statValue?: number;
  statDisplay?: string;
  interp?: { level: string; css: string; status: string };
  narrative?: string;
  histogram?: Array<{
    binLabel: string;
    binMid: number;
    count: number;
    normalY: number;
  }>;
  qqData?: Array<{
    theoretical: number;
    sample: number;
  }>;
  error?: string;
}

export interface NormalityResponse {
  ok: boolean;
  error?: string;
  method?: string;
  methodLabel?: string;
  alpha?: number;
  results?: Record<string, NormalityItemResult>;
  summary?: {
    totalTested: number;
    normalCount: number;
    notNormalCount: number;
  };
}
