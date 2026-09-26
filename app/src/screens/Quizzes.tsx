import React, { useMemo } from "react";
import { QuizRound, type QuizItem } from "./QuizRound";
import { level, getProfile, getSync, store } from "../session";
import { makeQuestion, topicTitle, type Topic } from "../../../src/curriculum";
import { makeGeoQuestion } from "../../../src/games/geo";
import { DAILY_LENGTH, dailyTitle, makeDaily } from "../../../src/daily";

/** Map Quiz: capitals, continents, "which country is highlighted" and flags, with region focus and zoom. */
export function MapQuiz({ topic }: { topic: Topic }) {
  return <QuizRound title={topicTitle(topic)} topic={topic} getItem={(): QuizItem => { const l = level(topic); return { topic, level: l, q: makeGeoQuestion(l, Math.random, topic) }; }} />;
}

/** Fallback game for any curriculum topic without a custom screen: plain multiple choice from makeQuestion. */
export function GenericQuiz({ topic }: { topic: Topic }) {
  return <QuizRound title={topicTitle(topic)} topic={topic} getItem={(): QuizItem => { const l = level(topic); return { topic, level: l, q: makeQuestion(topic, l) }; }} />;
}

/** Daily challenge: the same mixed set all day for this child, across every topic. */
export function Daily() {
  const items = useMemo(() => makeDaily(store.today(), getProfile()?.childKey ?? "guest", getSync().progress), []);
  return <QuizRound title={dailyTitle()} topic="daily" daily total={Math.min(DAILY_LENGTH, items.length)} showLevel={false} getItem={(i): QuizItem => ({ topic: items[i].topic, level: items[i].level, q: items[i].question })} />;
}
