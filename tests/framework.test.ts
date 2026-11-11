import {describe,it,expect} from "vitest";import {phases,templates,getTemplate} from "../lib/framework";
describe("Conecta Bancaribe",()=>{it("tiene cuatro fases",()=>expect(phases).toHaveLength(4));it("mapea las plantillas del framework",()=>{expect(getTemplate(3)?.phase).toBe(2);expect(getTemplate(19)?.phase).toBe(4);expect(templates.length).toBeGreaterThanOrEqual(17)});});
