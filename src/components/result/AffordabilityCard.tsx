"use client";

import { useHousePinStore } from "@/store/useHousePinStore";
import { Card, Badge } from "@/components/common";
import { formatToKoreanWon } from "@/lib/utils/format";

export default function AffordabilityCard() {
  const loanResult = useHousePinStore((s) => s.loanResult);
  const assetInput = useHousePinStore((s) => s.assetInput);

  if (!loanResult) return null;

  const {
    affordablePrice,
    jeonseAffordable,
    finalLoanLimit,
    ltv,
    limitingFactor,
  } = loanResult;

  const ownCapital = assetInput.ownCapital;
  const capitalRatio =
    affordablePrice > 0
      ? Math.round((ownCapital / affordablePrice) * 100)
      : 0;
  const loanRatio = 100 - capitalRatio;

  const limitingMessage =
    limitingFactor === "dsr"
      ? "DSR 기준으로 한도가 결정되었습니다"
      : "LTV 기준으로 한도가 결정되었습니다";

  return (
    <Card>
      <h3 className="mb-1 text-lg font-semibold text-primary">구매력 요약</h3>
      <p className="mb-6 text-sm text-secondary">
        입력하신 자산 기반 산출 결과예요
      </p>

      {/* 매매 가능 금액 */}
      <div className="mb-2">
        <p className="text-sm text-secondary">매매 가능 금액</p>
        <p className="text-[32px] font-bold leading-tight text-accent">
          {formatToKoreanWon(affordablePrice)}
        </p>
      </div>

      {/* 전세 가능 금액 */}
      {jeonseAffordable > 0 && (
        <div className="mb-6">
          <p className="text-sm text-secondary">전세 가능 금액</p>
          <p className="text-lg font-semibold text-primary">
            {formatToKoreanWon(jeonseAffordable)}
          </p>
        </div>
      )}

      {/* 자기자본 / 대출 비율 바 */}
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-secondary">
            자기자본{" "}
            <span className="font-semibold text-primary">
              {formatToKoreanWon(ownCapital)}
            </span>
          </span>
          <span className="text-secondary">
            대출금{" "}
            <span className="font-semibold text-accent">
              {formatToKoreanWon(finalLoanLimit)}
            </span>
          </span>
        </div>

        <div
          className="flex h-10 w-full overflow-hidden rounded-[12px]"
          role="img"
          aria-label={`자기자본 ${capitalRatio}%, 대출금 ${loanRatio}%`}
        >
          {capitalRatio > 0 && (
            <div
              className="flex items-center justify-center bg-surface text-xs font-semibold text-secondary"
              style={{ width: `${capitalRatio}%` }}
            >
              {capitalRatio}%
            </div>
          )}
          {loanRatio > 0 && (
            <div
              className="flex items-center justify-center bg-accent text-xs font-semibold text-white"
              style={{ width: `${loanRatio}%` }}
            >
              {loanRatio}%
            </div>
          )}
        </div>
      </div>

      {/* LTV 비율 */}
      <div className="mb-4 flex items-center gap-2">
        <Badge variant="info">LTV {Math.round(ltv * 100)}%</Badge>
      </div>

      {/* 제한 요인 안내 */}
      <p className="text-sm text-secondary">{limitingMessage}</p>
    </Card>
  );
}
