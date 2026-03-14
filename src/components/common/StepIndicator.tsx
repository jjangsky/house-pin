const STEPS = [
  "자산 입력",
  "대출 계산",
  "지역 선택",
  "매물 추천",
] as const;

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="진행 단계" className="flex items-center justify-center py-6 px-5">
      <ol className="flex items-center gap-0">
        {STEPS.map((label, index) => {
          const step = index + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <li key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold
                    ${isCompleted ? "bg-accent text-white" : ""}
                    ${isCurrent ? "bg-accent text-white" : ""}
                    ${!isCompleted && !isCurrent ? "bg-surface text-secondary" : ""}
                  `}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <svg
                      width="14"
                      height="10"
                      viewBox="0 0 14 10"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M1 5L5 9L13 1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium hidden sm:block
                    ${isCurrent ? "text-accent" : ""}
                    ${isCompleted ? "text-accent" : ""}
                    ${!isCompleted && !isCurrent ? "text-secondary" : ""}
                  `}
                >
                  {label}
                </span>
              </div>

              {step < STEPS.length && (
                <div
                  className={`
                    mx-2 h-[2px] w-8 sm:w-12
                    ${step < currentStep ? "bg-accent" : "bg-border"}
                  `}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
