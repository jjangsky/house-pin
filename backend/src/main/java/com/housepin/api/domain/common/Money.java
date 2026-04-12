package com.housepin.api.domain.common;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.text.NumberFormat;
import java.util.Locale;

/**
 * 금액 Value Object (만원 단위).
 * 내부적으로 만원 단위 정수를 보관하며, 화면 표시용 억/만원 변환 메서드를 제공한다.
 */
@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EqualsAndHashCode
public class Money {

    @Column(nullable = false)
    private int amount; // 만원 단위

    private Money(int amount) {
        if (amount < 0) {
            throw new IllegalArgumentException("금액은 음수일 수 없습니다: " + amount);
        }
        this.amount = amount;
    }

    public static Money of(int amountInManWon) {
        return new Money(amountInManWon);
    }

    public static Money zero() {
        return new Money(0);
    }

    /**
     * 억/만원 형식의 한국어 문자열로 변환한다.
     * 예: 42000 → "4억 2,000만 원", 500 → "500만 원", 100000 → "10억 원"
     */
    public String toEok() {
        if (amount == 0) {
            return "0원";
        }

        int eok = amount / 10000;
        int man = amount % 10000;
        NumberFormat formatter = NumberFormat.getInstance(Locale.KOREA);

        StringBuilder sb = new StringBuilder();
        if (eok > 0) {
            sb.append(eok).append("억");
        }
        if (man > 0) {
            if (eok > 0) {
                sb.append(" ");
            }
            sb.append(formatter.format(man)).append("만");
        }
        sb.append(" 원");
        return sb.toString();
    }

    public Money add(Money other) {
        return new Money(this.amount + other.amount);
    }

    public Money subtract(Money other) {
        int result = this.amount - other.amount;
        if (result < 0) {
            throw new IllegalArgumentException(
                    "뺄셈 결과가 음수입니다: " + this.amount + " - " + other.amount);
        }
        return new Money(result);
    }

    public boolean isGreaterThan(Money other) {
        return this.amount > other.amount;
    }

    public boolean isLessThanOrEqual(Money other) {
        return this.amount <= other.amount;
    }

    @Override
    public String toString() {
        return toEok();
    }
}
