import type { Metadata } from "next";
import Link from "next/link";
import {
  CRITICAL_OCCUPATION_THRESHOLD,
  HIGH_OCCUPATION_THRESHOLD,
  PROFILE_WEEKS,
  STALE_AFTER_HOURS,
  TREND_WINDOW_HOURS,
} from "@quebec-urgences/shared";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Comment lire le tableau de bord Urgences Québec : ce que mesure le taux d'occupation, d'où viennent les données et quelles sont leurs limites.",
};

const REPO_URL = "https://github.com/brunokinder/quebec-urgences";
const DATA_URL = "https://www.donneesquebec.ca/";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      <div className="space-y-3 text-sm leading-relaxed text-slate-300">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-3">
        <Link href="/" className="text-xs text-blue-400 hover:text-blue-300">
          ← Retour au tableau de bord
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-50">À propos</h2>
        <p className="text-sm leading-relaxed text-slate-300">
          Urgences Québec rend lisibles les données publiques sur l&apos;achalandage des urgences
          du Québec. C&apos;est un projet citoyen, bénévole et open source : il n&apos;est affilié ni
          au ministère de la Santé et des Services sociaux (MSSS) ni à Santé Québec.
        </p>
      </header>

      <div className="rounded-xl border border-red-900/50 bg-red-950/40 p-5 text-sm leading-relaxed text-slate-200">
        <p>
          <strong className="text-red-300">Urgence vitale : composez le 911.</strong> Pour un conseil
          santé, appelez Info-Santé au{" "}
          <a href="tel:811" className="font-semibold underline hover:text-white">811</a>.
        </p>
        <p className="mt-2 text-slate-300">
          Ces chiffres ne remplacent pas un avis médical. Ne retardez jamais une visite et ne changez
          pas d&apos;hôpital à cause d&apos;eux : une urgence très occupée soigne toujours les cas les
          plus graves en premier.
        </p>
      </div>

      <Section title="Comment lire le tableau">
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <strong className="text-slate-100">Le taux d&apos;occupation</strong> compare le nombre de
            personnes sur civière à l&apos;urgence au nombre de civières prévues. À 100 %, toutes les
            civières sont occupées; au-delà, des patients attendent sur des civières ajoutées.
          </li>
          <li>
            <strong className="text-slate-100">Les couleurs</strong> : vert sous{" "}
            {HIGH_OCCUPATION_THRESHOLD} %, jaune de {HIGH_OCCUPATION_THRESHOLD} à{" "}
            {CRITICAL_OCCUPATION_THRESHOLD} % (surchargée), rouge au-delà de{" "}
            {CRITICAL_OCCUPATION_THRESHOLD} % (critique).
          </li>
          <li>
            <strong className="text-slate-100">La flèche de tendance</strong> indique si
            l&apos;urgence se remplit ou se vide par rapport à il y a {TREND_WINDOW_HOURS} heures.
          </li>
          <li>
            <strong className="text-slate-100">Le niveau habituel</strong> et la carte de chaleur
            montrent la médiane des {PROFILE_WEEKS} dernières semaines pour chaque jour et chaque
            heure. Ils décrivent le passé et ne garantissent rien pour aujourd&apos;hui.
          </li>
        </ol>
      </Section>

      <Section title="Ce que ces chiffres ne disent pas">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-slate-100">Ce n&apos;est pas un temps d&apos;attente.</strong>{" "}
            Votre attente dépend surtout de votre priorité de triage. Les délais officiels
            après le triage sont publiés séparément par Santé Québec.
          </li>
          <li>
            Le taux ne compte que les patients sur civière, pas les personnes qui attendent dans la
            salle d&apos;attente.
          </li>
          <li>
            Les données sont publiées environ une fois par heure. Elles ne sont pas en temps réel.
            Une installation sans nouvelle donnée depuis plus de {STALE_AFTER_HOURS} heures est
            signalée comme non à jour.
          </li>
        </ul>
      </Section>

      <Section title="D'où viennent les données">
        <p>
          Les données proviennent du MSSS (Console provinciale des urgences), diffusées sur{" "}
          <a href={DATA_URL} className="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noopener noreferrer">
            Données Québec
          </a>{" "}
          sous licence CC-BY 4.0. Le site les récupère chaque heure, les conserve pour en tirer un
          historique et les affiche telles quelles, sans les corriger. Si un chiffre vous semble
          erroné, il l&apos;est probablement aussi à la source.
        </p>
      </Section>

      <Section title="Code source et contribution">
        <p>
          Tout le code est libre (licence MIT) et disponible sur{" "}
          <a href={REPO_URL} className="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          . Les contributions sont les bienvenues, que vous soyez développeur·euse, designer ou
          simplement utilisateur·trice.
        </p>
      </Section>

      <Section title="Nous joindre">
        <p>
          Pour signaler une erreur, proposer une idée ou poser une question, ouvrez une{" "}
          <a href={`${REPO_URL}/issues`} className="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noopener noreferrer">
            demande sur GitHub
          </a>
          . Ce site ne collecte aucune donnée personnelle de santé.
        </p>
      </Section>
    </article>
  );
}
