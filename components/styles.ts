"use client";

import styled, { createGlobalStyle, css } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  html { background: #f2f5f1; }
  body { margin: 0; color: #173126; font-family: Arial, Helvetica, sans-serif; }
  button, input, select { font: inherit; }
  button { -webkit-tap-highlight-color: transparent; }
`;

export const Shell = styled.div`
  min-height: 100vh;
  padding-bottom: 6rem;
`;

export const Header = styled.header`
  background: #155f37;
  color: white;
  padding: 1rem;
  box-shadow: 0 4px 18px rgba(20, 73, 43, 0.18);
`;

export const HeaderInner = styled.div`
  width: min(72rem, 100%);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: .75rem;
  h1 { margin: 0; font-size: 1.2rem; line-height: 1.1; }
  span { display: block; margin-top: .22rem; color: #cce9d5; font-size: .78rem; }
`;

export const BrandIcon = styled.div`
  width: 2.7rem;
  height: 2.7rem;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: .85rem;
  background: #fff;
  color: #155f37;
`;

export const SyncBadge = styled.div`
  display: flex;
  align-items: center;
  gap: .4rem;
  padding: .45rem .65rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, .13);
  font-size: .75rem;
  white-space: nowrap;
  svg { width: .85rem; height: .85rem; }
  @media (max-width: 28rem) { span { display: none; } }
`;

export const Main = styled.main`
  width: min(72rem, calc(100% - 2rem));
  margin: 1.5rem auto 0;
`;

export const Navigation = styled.nav`
  display: flex;
  gap: .35rem;
  width: fit-content;
  padding: .3rem;
  margin-bottom: 1.25rem;
  background: #e1e8e2;
  border-radius: .8rem;
`;

export const NavButton = styled.button<{ $active: boolean }>`
  border: 0;
  border-radius: .6rem;
  padding: .65rem 1rem;
  color: #4b6257;
  background: transparent;
  cursor: pointer;
  ${({ $active }) => $active && css`
    color: #173126;
    background: white;
    box-shadow: 0 1px 4px rgba(32, 54, 42, .12);
    font-weight: 700;
  `}
`;

export const PurchaseHead = styled.section`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  h2 { margin: 0 0 .3rem; font-size: clamp(1.45rem, 4vw, 2rem); }
  p { margin: 0; color: #64756c; }
  @media (max-width: 38rem) { align-items: flex-start; flex-direction: column; }
`;

const buttonBase = css`
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  border: 0;
  border-radius: .7rem;
  padding: .65rem .9rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform .15s ease, background .15s ease;
  &:active { transform: scale(.98); }
  &:disabled { cursor: not-allowed; opacity: .55; }
  svg { width: 1.05rem; height: 1.05rem; }
`;

export const PrimaryButton = styled.button`
  ${buttonBase}
  color: white;
  background: #176b3a;
  &:hover { background: #10572e; }
`;

export const SecondaryButton = styled.button`
  ${buttonBase}
  color: #28513c;
  background: #e5eee7;
  &:hover { background: #d8e6dc; }
`;

export const DangerButton = styled.button`
  ${buttonBase}
  min-height: 2.5rem;
  color: #a13535;
  background: #fff0ef;
`;

export const Panel = styled.section`
  overflow: hidden;
  border: 1px solid #dce4dd;
  border-radius: 1rem;
  background: white;
  box-shadow: 0 8px 30px rgba(37, 70, 49, .07);
`;

export const DesktopTable = styled.div`
  @media (max-width: 48rem) { display: none; }
`;

export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 3.5rem minmax(12rem, 1fr) 7.5rem 7rem 9rem 9rem 6.5rem;
  gap: .6rem;
  align-items: center;
  padding: .75rem 1rem;
  color: #617269;
  background: #f6f8f6;
  border-bottom: 1px solid #e3e9e4;
  font-size: .8rem;
  font-weight: 700;
`;

export const TableRow = styled.div<{ $picked?: boolean }>`
  display: grid;
  grid-template-columns: 3.5rem minmax(12rem, 1fr) 7.5rem 7rem 9rem 9rem 6.5rem;
  gap: .6rem;
  align-items: center;
  min-height: 4.5rem;
  padding: .7rem 1rem;
  border-bottom: 1px solid #edf0ed;
  background: ${({ $picked }) => $picked ? "#f0f8f2" : "white"};
  &:last-child { border-bottom: 0; }
`;

export const MobileList = styled.div`
  display: none;
  @media (max-width: 48rem) { display: block; }
`;

export const MobileCard = styled.article<{ $picked?: boolean }>`
  padding: 1rem;
  border-bottom: 1px solid #e5ebe6;
  background: ${({ $picked }) => $picked ? "#f0f8f2" : "white"};
  &:last-child { border-bottom: 0; }
`;

export const MobileTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: .75rem;
  margin-bottom: .9rem;
`;

export const MobileProduct = styled.div`
  flex: 1;
  min-width: 0;
  strong { display: block; overflow-wrap: anywhere; font-size: 1.05rem; }
  small { color: #6a7a72; }
`;

export const MobileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .65rem;
  div { min-width: 0; }
  span { display: block; margin-bottom: .18rem; color: #738179; font-size: .72rem; }
  strong { font-size: .92rem; }
`;

export const RowActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: .3rem;
`;

export const IconButton = styled.button<{ $danger?: boolean }>`
  width: 2.55rem;
  height: 2.55rem;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: .65rem;
  color: ${({ $danger }) => $danger ? "#a53d3d" : "#315744"};
  background: ${({ $danger }) => $danger ? "#fff0ef" : "#e9f0eb"};
  cursor: pointer;
  svg { width: 1rem; height: 1rem; }
`;

export const CheckButton = styled.button<{ $checked: boolean }>`
  width: 2.5rem;
  height: 2.5rem;
  display: grid;
  place-items: center;
  border: 2px solid ${({ $checked }) => $checked ? "#198b4c" : "#aab9b0"};
  border-radius: .7rem;
  color: white;
  background: ${({ $checked }) => $checked ? "#198b4c" : "white"};
  cursor: pointer;
  svg { width: 1.25rem; height: 1.25rem; }
`;

export const TextInput = styled.input`
  width: 100%;
  min-height: 2.65rem;
  border: 1px solid #cbd6ce;
  border-radius: .6rem;
  padding: .55rem .65rem;
  color: #173126;
  background: white;
  outline: none;
  &:focus { border-color: #237c48; box-shadow: 0 0 0 3px rgba(35, 124, 72, .12); }
`;

export const Select = styled.select`
  ${TextInput}
`;

export const AddForm = styled.form`
  display: grid;
  grid-template-columns: minmax(12rem, 1fr) 7.5rem 7rem 9rem auto;
  gap: .75rem;
  align-items: end;
  padding: 1rem;
  background: #f7faf7;
  border-top: 1px solid #e0e8e1;
  label { color: #5d7065; font-size: .76rem; font-weight: 700; }
  label > span { display: block; margin-bottom: .3rem; }
  @media (max-width: 48rem) {
    grid-template-columns: 1fr 1fr;
    label:first-child { grid-column: 1 / -1; }
    button { grid-column: 1 / -1; }
  }
`;

export const AddArea = styled.div`
  padding: 1rem;
  border-top: 1px solid #e3e9e4;
  button { width: 100%; }
`;

export const TotalBar = styled.section`
  position: sticky;
  bottom: .75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1rem 1.25rem;
  color: white;
  background: #173e2a;
  border-radius: 1rem;
  box-shadow: 0 10px 28px rgba(17, 55, 34, .25);
  span { display: block; color: #bcd9c7; font-size: .78rem; }
  strong { font-size: clamp(1.35rem, 5vw, 2rem); }
  @media (max-width: 34rem) { align-items: stretch; flex-direction: column; button { width: 100%; } }
`;

export const Empty = styled.div`
  padding: 3rem 1rem;
  text-align: center;
  color: #64756c;
  svg { width: 2.8rem; height: 2.8rem; margin-bottom: .6rem; color: #8aaa96; }
  h3 { margin: 0 0 .4rem; color: #2d493a; }
  p { margin: 0; }
`;

export const HistoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
  gap: 1rem;
`;

export const HistoryCard = styled.button`
  display: block;
  width: 100%;
  border: 1px solid #dce4dd;
  border-radius: 1rem;
  padding: 1.1rem;
  color: #173126;
  background: white;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 5px 18px rgba(37, 70, 49, .06);
  h3 { margin: 0 0 .9rem; font-size: 1.05rem; }
  div { display: flex; justify-content: space-between; margin-top: .45rem; color: #64756c; }
  strong { color: #173126; }
`;

export const Notice = styled.div`
  margin-bottom: 1rem;
  padding: .75rem 1rem;
  border: 1px solid #f0d899;
  border-radius: .75rem;
  color: #6c5316;
  background: #fff8df;
  font-size: .86rem;
`;

export const ErrorNotice = styled(Notice)`
  border-color: #edb5b1;
  color: #853332;
  background: #fff0ef;
`;

export const Loading = styled.div`
  padding: 4rem 1rem;
  color: #64756c;
  text-align: center;
`;
