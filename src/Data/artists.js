import React, { useState } from 'react';
// Original artists from the first file
// Original artists from the first file

import almost from '../Assets/artists/almost.png';
import artisanP from '../Assets/artists/artisan-p.png';
import babyyDre from '../Assets/artists/babyy-dre.png';
import bandOfNames from '../Assets/artists/band-of-names.png';
import blairStone from '../Assets/artists/blair-stone.png';
import brassWizard from '../Assets/artists/brass-wizard.png';
import caroGarcia from '../Assets/artists/caro-garcia.png';
import castover from '../Assets/artists/castover.png';
import cjAndTheDeadmen from '../Assets/artists/cj-and-the-deadmen.png';
import cloudStorage from '../Assets/artists/cloud-storage.png';
import counterfeitStereo from '../Assets/artists/counterfeit-stereo.png';
import curlyQ from '../Assets/artists/curly-q.png';
import dal3di from '../Assets/artists/dal3di.png';
import dallasAleea from '../Assets/artists/dallas-aleea.png';
import daltonLain from '../Assets/artists/dalton-lain.png';
import danitza from '../Assets/artists/danitza.png';
import dearCincinnati from '../Assets/artists/dear-cincinnati.png';
import dogGonePlanet from '../Assets/artists/dog-gone-planet.png';
import durtySuns from '../Assets/artists/durty-suns.png';
import electricAngel from '../Assets/artists/electric-angel.png';
import gangsOfParis from '../Assets/artists/gangs-of-paris.png';
import gila from '../Assets/artists/gila.png';
import housingCows from '../Assets/artists/housing-cows.png';
import jaggn from '../Assets/artists/jaggn.png';
import joybomb from '../Assets/artists/joybomb.png';
import looseThreads from '../Assets/artists/loose-threads.png';
import medians from '../Assets/artists/medians.png';
import mutualFriends from '../Assets/artists/mutual-friends.png';
import npcLuv from '../Assets/artists/npc-luv.png';
import onTheEdge from '../Assets/artists/on-the-edge.png';
import ourFinalFeud from '../Assets/artists/our-final-feud.png';
import palaceRats from '../Assets/artists/palace-rats.png';
import pettyProblems from '../Assets/artists/petty-problems.png';
import pineappleTuesday from '../Assets/artists/pineapple-tuesday.png';
import pitViolets from '../Assets/artists/pitviolets.png';
import rasclat from '../Assets/artists/Rasclat.png';
import ryGuy from '../Assets/artists/ry-guy.png';
import sigsInside from '../Assets/artists/sigs-inside.png';
import sleepybug from '../Assets/artists/sleepybug.png';
import sofiacamille from '../Assets/artists/sofia-camille.png';
import solomonHill from '../Assets/artists/solomon-hill.png';
import tearman from '../Assets/artists/tearman.png';
import theNancys from '../Assets/artists/the-nancys.png';
import theRelishGirls from '../Assets/artists/the-relish-girls.png';
import theVillageIdiots from '../Assets/artists/the-village-idiots.png';
import theYeahBabys from '../Assets/artists/the-yeah-babys.png';
import westgreen from '../Assets/artists/west-green.png';
import williamCreamer from '../Assets/artists/william-creamer.png';
import yourWeatherboys from '../Assets/artists/weather-boys.png';
import yungPhlan from '../Assets/artists/yungphlan.png';

// New artist imports
import ahri from '../Assets/artists/ahri.png';
import amateurAct from '../Assets/artists/amateur-act.png';
import backwardsDriving from '../Assets/artists/backwards-driving.png';
import bruvvy from '../Assets/artists/bruvvy.png';
import callieFlemming from '../Assets/artists/callie-flemming-and-the-fifth-wave.png';
import callistosCollapse from '../Assets/artists/callistos-collapse.png';
import defDog from '../Assets/artists/def-dog.png';
import failedState from '../Assets/artists/failed-state.png';
import fallsChase from '../Assets/artists/falls-chase.png';
import fgt from '../Assets/artists/fgt.png';
import flyingBison from '../Assets/artists/flying bison.png';
import gabbalish from '../Assets/artists/gabbalish.png';
import januaryAgain from '../Assets/artists/january-again.png';
import kanise from '../Assets/artists/kanise.png';
import keia from '../Assets/artists/keia.png';
import killerChoice from '../Assets/artists/killer-choice.png';
import lexFly from '../Assets/artists/lex-fly.png';
import lillode from '../Assets/artists/lillode.png';
import mcwire from '../Assets/artists/mcwire.png';
import modayy from '../Assets/artists/modayy.png';
import morningStation from '../Assets/artists/morning-station.png';
import mulch from '../Assets/artists/mulch.png';
import mutualDisdain from '../Assets/artists/mutual-disdain.png';
import notMilk from '../Assets/artists/not-milk.png';
import notReally from '../Assets/artists/not-really.png';
import oaksExperiment from '../Assets/artists/oaks-experiment.png';
import paleHysteria from '../Assets/artists/pale-hysteria.png';
import pondscum from '../Assets/artists/pondscum.png';
import quintintyevon from '../Assets/artists/quintin-tyevon.png';
import s4ge from '../Assets/artists/sage.png';
import satin from '../Assets/artists/satin.png';
import saturnalia from '../Assets/artists/saturnalia.png';
import slitImg from '../Assets/artists/slit.png';
import soulCandy from '../Assets/artists/soul-candy.png';
import steenImg from '../Assets/artists/steen.png';
import stoneheads from '../Assets/artists/stoneheads.png';
import taint from '../Assets/artists/taint.png';
import theCasualties from '../Assets/artists/the-casualties.png';
import theFlirt from '../Assets/artists/the-flirt.png';
import theNova from '../Assets/artists/the-nova.png';
import theRetrograde from '../Assets/artists/the-retrograde.png';
import wormworld from '../Assets/artists/worm-world.png';
import yvsn from '../Assets/artists/ysvn.png';
import djTimGreene from '../Assets/artists/dj-tim-greene.png';
import agRitch from '../Assets/artists/ag-ritch.png';
import facey from '../Assets/artists/facey.png';

export const artists = [
    {
      name: "Almost",
      genre: "Indie Rock, Alternative",
      bio: "High-energy performances with melodic hooks",
      image: almost,
      links: {
        instagram: "https://www.instagram.com/almostiscool"
      },
      featured: true
    },
    {
      name: "Artisan P",
      genre: "Rap, Hip-Hop, EDM",
      bio: "Rapper/DJ",
      image: artisanP,
      links: {
        instagram: "https://www.instagram.com/artisanpmusic"
      },
      featured: true
    },
    {
      name: "Babyy Dre",
      genre: "Hip-Hop, Rap",
      bio: "Rapping, Singing",
      image: babyyDre,
      links: {
        instagram: "https://www.instagram.com/OfficialBabyyDre"
      },
      featured: true
    },
    {
      name: "Band of Names",
      genre: "70s Hard Rock, Punk, Psychedelic Soul Fusion",
      bio: "Guitar, Bass, Drums, Vocals",
      image: bandOfNames,
      links: {
        instagram: "https://www.instagram.com/bandofnames"
      },
      featured: true
    },
    {
      name: "Blairstone",
      genre: "Indie Rock, Alternative",
      bio: "New local band with fresh sound",
      image: blairStone,
      links: {
        instagram: "https://www.instagram.com/blairstone_band"
      },
      featured: true
    },
    {
      name: "Brass Wizard",
      genre: "Metal, Experimental, Doom Jazz",
      bio: "Vocals, Guitar, Bass, Drums, Trombone",
      image: brassWizard,
      links: {
        instagram: "https://www.instagram.com/brasswizardfl"
      },
      featured: true
    },
    {
      name: "Caro Garcia",
      genre: "Latin Pop, R&B",
      bio: "Soulful vocals and bilingual performances",
      image: caroGarcia,
      links: {
        instagram: "https://www.instagram.com/caroo.garcia7"
      },
      featured: true
    },
    {
      name: "Castover",
      genre: "Alt",
      bio: "Live Music",
      image: castover,
      links: {
        instagram: "https://www.instagram.com/castoverband"
      },
      featured: true
    },
    {
      name: "CJ and The Deadmen",
      genre: "Rock, Alt",
      bio: "Vocals, Guitar, Bass, Drums",
      image: cjAndTheDeadmen,
      links: {
        instagram: "https://www.instagram.com/cjandthedeadmen"
      },
      featured: true
    },
    {
      name: "Cloud Storage",
      genre: "Shoegaze, Dream Pop, Indie Rock",
      bio: "Vocals, Guitar, Bass, Drums, Live Visuals",
      image: cloudStorage,
      links: {
        instagram: "https://www.instagram.com/cloudstorageband"
      },
      featured: true
    },
    {
      name: "Counterfeit Stereo",
      genre: "Alt Rock, Indie Rock",
      bio: "Vocals, Guitar, Bass, Drums",
      image: counterfeitStereo,
      links: {
        instagram: "https://www.instagram.com/counterfeitstereo"
      },
      featured: true
    },
    {
      name: "Curly Q",
      genre: "Emo, Pop, Punk",
      bio: "Originals Only",
      image: curlyQ,
      links: {
        instagram: "https://www.instagram.com/curlyqfl"
      },
      featured: true
    },
    {
      name: "Medians",
      genre: "Math Rock, Post-Rock",
      bio: "Guitar-heavy, Experimental",
      image: medians,
      links: {
        instagram: "https://www.instagram.com/mediansfl"
      },
      featured: true
    },
    {
      name: "Dal3di",
      genre: "EDM, Techno",
      bio: "DJ",
      image: dal3di,
      links: {
        instagram: "https://www.instagram.com/dal3di"
      },
      featured: true
    },
    {
      name: "Dallas Aleea",
      genre: "R&B",
      bio: "Vocals, Lead Guitar, Bass, Keys, Drums",
      image: dallasAleea,
      links: {
        instagram: "https://www.instagram.com/dallasaleea"
      },
      featured: true
    },
    {
      name: "Dalton Lain",
      genre: "EDM, Techno",
      bio: "DJ",
      image: daltonLain,
      links: {
        instagram: "https://www.instagram.com/dalton.lain"
      },
      featured: true
    },
    {
      name: "Danitza",
      genre: "Alt Pop, Latin Pop, Indie Soul",
      bio: "Vocals, Songwriting, Electric Guitar",
      image: danitza,
      links: {
        instagram: "https://www.instagram.com/danitzaofficial"
      },
      featured: true
    },
    {
      name: "Dear Cincinnati",
      genre: "Midwest Emo",
      bio: "5 piece 2 guitar, bass, drum, vocals",
      image: dearCincinnati,
      links: {
        instagram: "https://www.instagram.com/dearcincinnati"
      },
      featured: true
    },
    {
      name: "Dog Gone Planet",
      genre: "Folk Punk, Acoustic Emo",
      bio: "Acoustic Guitar, Vocals, Harmonica, Songwriting",
      image: dogGonePlanet,
      links: {
        instagram: "https://www.instagram.com/doggoneplanet"
      },
      featured: true
    },
    {
      name: "Durty Suns",
      genre: "Rock, Indie Rock, Grunge",
      bio: "Vocals, Guitar, Bass, Drums, Songwriting",
      image: durtySuns,
      links: {
        instagram: "https://www.instagram.com/durtysuns"
      },
      featured: true
    },
    {
      name: "Electric Angel",
      genre: "Funk, Soul",
      bio: "Vocals, Guitar, Bass, Drums, Keyboard, Trumpet",
      image: electricAngel,
      links: {
        instagram: "https://www.instagram.com/electricangelband"
      },
      featured: true
    },
    {
      name: "Gangs Of Paris",
      genre: "Rock, Punk",
      bio: "High energy punk! Guitar x2, bass, drums, vocals",
      image: gangsOfParis,
      links: {
        instagram: "https://www.instagram.com/gangsofparis_band"
      },
      featured: true
    },
    {
      name: "Gila",
      genre: "Metal",
      bio: "Bass, Lead Guitar, Drums, Rhythm Guitar, Clean Vocals, Scream Vocals",
      image: gila,
      links: {
        instagram: "https://www.instagram.com/gila.fl"
      },
      featured: true
    },
    {
      name: "Housing Cows",
      genre: "Indie Rock, Alternative, Punk Rock",
      bio: "Vocals, Guitar, Bass, Cello",
      image: housingCows,
      links: {
        instagram: "https://www.instagram.com/housingcows"
      },
      featured: true
    },
    {
      name: "JaggN",
      genre: "Hip-Hop, Rap",
      bio: "Energetic performances with a unique flow",
      image: jaggn,
      links: {
        instagram: "https://www.instagram.com/jaggn_"
      },
      featured: true
    },
    {
      name: "Joybomb",
      genre: "Alt Punk, Rock 'n' Roll",
      bio: "Vocals, Guitar, Bass, Drums",
      image: joybomb,
      links: {
        instagram: "https://www.instagram.com/joybombofficial"
      },
      featured: true
    },
    {
      name: "Loose Threads",
      genre: "Alt, Rock, Metal",
      bio: "Keys, guitars, vocals, drums, bass",
      image: looseThreads,
      links: {
        instagram: "https://www.instagram.com/loosethreadstally"
      },
      featured: true
    },
    {
      name: "Mutual Friends",
      genre: "Indie Rock, Alternative",
      bio: "Melodic indie rock with thoughtful lyrics",
      image: mutualFriends,
      links: {
        instagram: "https://www.instagram.com/mutualfriends.music"
      },
      featured: true
    },
    {
      name: "NPC Luv",
      genre: "Indie Rock, Alt-Pop, Experimental",
      bio: "Vocals, Guitar, Bass, Drums",
      image: npcLuv,
      links: {
        instagram: "https://www.instagram.com/npc.luv"
      },
      featured: true
    },
    {
      name: "On The Edge",
      genre: "Alt Rock, Indie Rock, Garage Rock",
      bio: "Vocals, Guitar, Bass, Drums – catchy melodies, driving riffs, nostalgic early-2010s",
      image: onTheEdge,
      links: {
        instagram: "https://www.instagram.com/on.the.edge.band"
      },
      featured: true
    },
    {
      name: "Our Final Feud",
      genre: "Metal, Hardcore, Metalcore",
      bio: "Vocals (screamed), Lead Guitar, Rhythm Guitar, Bass, Drums",
      image: ourFinalFeud,
      links: {
        instagram: "https://www.instagram.com/ourfinalfeudofficial"
      },
      featured: true
    },
    {
      name: "Palace Rats",
      genre: "Indie Rock, Alt Rock",
      bio: "Energetic performances with catchy hooks",
      image: palaceRats,
      links: {
        instagram: "https://www.instagram.com/palacerats"
      },
      featured: true
    },
    {
      name: "Petty Problems",
      genre: "Folk Punk, Rock",
      bio: "Energetic folk punk with raw, authentic sound",
      image: pettyProblems,
      links: {
        instagram: "https://www.instagram.com/pettyproblemsmusic"
      },
      featured: false
    },
    {
      name: "Pineapple Tuesday",
      genre: "Rock, Indie Rock, Eclectic",
      bio: "Vocals, Guitar, Bass, Drums",
      image: pineappleTuesday,
      links: {
        instagram: "https://www.instagram.com/pineappletuesdayofficial"
      },
      featured: true
    },
    {
      name: "Pit Violets",
      genre: "Rock, Garage Rock",
      bio: "Vocals, Guitar, Bass, Drums",
      image: pitViolets,
      links: {
        instagram: "https://www.instagram.com/pitviolets"
      },
      featured: true
    },
    {
      name: "Rasclat",
      genre: "Alt, Hip-Hop",
      bio: "Rapping",
      image: rasclat,
      links: {
        instagram: "https://www.instagram.com/justRasclat"
      },
      featured: true
    },
    {
      name: "Ry Guy",
      genre: "EDM, Dance",
      bio: "DJ",
      image: ryGuy,
      links: {
        instagram: "https://www.instagram.com/rplunt"
      },
      featured: true
    },
    {
      name: "Sigs Inside",
      genre: "Rock, Garage Rock, Alt",
      bio: "Vocals, Guitar, Bass, Drums",
      image: sigsInside,
      links: {
        instagram: "https://www.instagram.com/sigsinsideband_"
      },
      featured: true
    },
    {
      name: "Sleepybug",
      genre: "Indie Rock, Lo-fi, Bedroom Pop",
      bio: "Vocals, Guitar, Lo-fi production, Full band and solo sets",
      image: sleepybug,
      links: {
        instagram: "https://www.instagram.com/sleepybug.mp3"
      },
      featured: true
    },
    {
      name: "Sofia Camille",
      genre: "Indie Pop, Alt-Soul",
      bio: "Vocals, Guitar, Songwriting, Live Performance",
      image: sofiacamille,
      links: {
        instagram: "https://www.instagram.com/sofiacamillemusic"
      },
      featured: true
    },
    {
      name: "Solomon Hill",
      genre: "Indie Rock, Alternative",
      bio: "Vocals, Guitar, Bass, Drums, Songwriting, Production",
      image: solomonHill,
      links: {
        instagram: "https://www.instagram.com/solomonhill.music"
      },
      featured: true
    },
    {
      name: "Tearman",
      genre: "Emo, Punk",
      bio: "Emotional punk music with powerful lyrics",
      image: tearman,
      links: {
        instagram: "https://www.instagram.com/tearmanfl"
      },
      featured: false
    },
    {
      name: "The Nancys",
      genre: "Indie, Folk, Alt",
      bio: "Vocals, Guitar, Drums, Bass",
      image: theNancys,
      links: {
        instagram: "https://www.instagram.com/thenancysband"
      },
      featured: true
    },
    {
      name: "The Relish Girls",
      genre: "Soft Rock, Indie Pop",
      bio: "Vocals, Guitar, Bass, Drums, Keys",
      image: theRelishGirls,
      links: {
        instagram: "https://www.instagram.com/therelishgirls"
      },
      featured: true
    },
    {
      name: "The Village Idiots",
      genre: "Indie Rock, Alternative Rock",
      bio: "Vocals, Guitar, Folk instrumentation, High-energy acoustic sets",
      image: theVillageIdiots,
      links: {
        instagram: "https://www.instagram.com/subpotentmusic"
      },
      featured: true
    },
    {
      name: "The Yeah Babys",
      genre: "Indie Rock, Soul, Alt Pop",
      bio: "Vocals, Guitar, Bass, Drums, Keys",
      image: theYeahBabys,
      links: {
        instagram: "https://www.instagram.com/theyeahbabys"
      },
      featured: true
    },
    {
      name: "Westgreen",
      genre: "Alt Rock, Indie",
      bio: "Saxophone, Guitar, Bass, Drums, Vocals",
      image: westgreen,
      links: {
        instagram: "https://www.instagram.com/westgreenfl"
      },
      featured: true
    },
    {
      name: "William Creamer",
      genre: "Pop, Alt",
      bio: "Piano, guitar, vocals, production",
      image: williamCreamer,
      links: {
        instagram: "https://www.instagram.com/williamcreamer"
      },
      featured: true
    },
    {
      name: "Your Weatherboys",
      genre: "Indie Rock, Dance Rock, Alternative Pop",
      bio: "Vocals, Guitar, Bass, Drums, Keys",
      image: yourWeatherboys,
      links: {
        instagram: "https://www.instagram.com/weatherboystheband"
      },
      featured: true
    },
    {
      name: "YungPhlan",
      genre: "Hip-Hop, Dance",
      bio: "DJ/Performer",
      image: yungPhlan,
      links: {
        instagram: "https://www.instagram.com/yungphlan"
      },
      featured: true
    },
    {
      name: "Ahri",
      genre: "EDM, Dance, Psytrance",
      bio: "DJ/Producer",
      image: ahri,
      links: {
        instagram: "https://www.instagram.com/ahriluvu"
      },
      featured: true
    },
    {
      name: "Amateur Act",
      genre: "Pop Punk, Alt Rock",
      bio: "Energetic performances with catchy hooks",
      image: amateurAct,
      links: {
        instagram: "https://www.instagram.com/amateur_act_official"
      },
      featured: true
    },
    {
      name: "Backwards Driving",
      genre: "Alt, Indie, Southeast Emo",
      bio: "Emotional performances with intricate guitar work",
      image: backwardsDriving,
      links: {
        instagram: "https://www.instagram.com/backwardsdriving"
      },
      featured: true
    },
    {
      name: "Bruvvy",
      genre: "Alt Rock, Emo",
      bio: "Passionate performances with emotional depth",
      image: bruvvy,
      links: {
        instagram: "https://www.instagram.com/bruvvyband"
      },
      featured: true
    },
    {
      name: "Callie Flemming & The Fifth Wave",
      genre: "No-Fi Rock, Punk, Indie Noise",
      bio: "Vocals, Guitar, Bass, Drums, Spoken Word, Lo-fi Production",
      image: callieFlemming,
      links: {
        instagram: "https://www.instagram.com/cfat5w"
      },
      featured: true
    },
    {
      name: "Callisto's Collapse",
      genre: "Prog Metal, Heavy Metal",
      bio: "Vocals, Guitar, Bass, Drums",
      image: callistosCollapse,
      links: {
        instagram: "https://www.instagram.com/callistos_collapse"
      },
      featured: true
    },
    {
      name: "Def Dogs",
      genre: "Hip-Hop Fusion",
      bio: "Innovative hip-hop with live instrumentation",
      image: defDog,
      links: {
        instagram: "https://www.instagram.com/defdogs"
      },
      featured: true
    },
    {
      name: "DJ Tim Greene",
      genre: "EDM, Dance, Riddim, Futurebass",
      bio: "DJ/Producer",
      image: djTimGreene,
      links: {
        instagram: "https://www.instagram.com/deejay_timothy_greene"
      },
      featured: true
    },
    {
      name: "Failed State",
      genre: "Heavy Metal, Metalcore, Thrash Metal",
      bio: "Intense performances with technical skill",
      image: failedState,
      links: {
        instagram: "https://www.instagram.com/failedstate.nflhc"
      },
      featured: true
    },
    {
      name: "Falls Chase",
      genre: "Hard Rock, Alt Rock",
      bio: "Powerful vocals and driving guitar riffs",
      image: fallsChase,
      links: {
        instagram: "https://www.instagram.com/falls_chase"
      },
      featured: true
    },
    {
      name: "FGT",
      genre: "Rap/Hip-Hop",
      bio: "Authentic lyrics with modern beats",
      image: fgt,
      links: {
        instagram: "https://www.instagram.com/flyyguy.ty"
      },
      featured: true
    },
    {
      name: "Flying Bison",
      genre: "Jazz, Latin Music, Latin Funk",
      bio: "Fusion of jazz and Latin rhythms",
      image: flyingBison,
      links: {
        instagram: "https://www.instagram.com/flyingbisonfl"
      },
      featured: true
    },
    {
      name: "Gabbalish",
      genre: "EDM, Dance, House",
      bio: "DJ/Producer",
      image: gabbalish,
      links: {
        instagram: "https://www.instagram.com/gabbalish.wav"
      },
      featured: true
    },
    {
      name: "January Again",
      genre: "Indie, Folk, Alt",
      bio: "Soulful vocals with acoustic instrumentation",
      image: januaryAgain,
      links: {
        instagram: "https://www.instagram.com/january.again.music"
      },
      featured: true
    },
    {
      name: "Kanise",
      genre: "R&B, Rap/Hip-Hop, Soul",
      bio: "Smooth vocals with contemporary production",
      image: kanise,
      links: {
        instagram: "https://www.instagram.com/kingkanise"
      },
      featured: true
    },
    {
      name: "Keia",
      genre: "Hip-Hop, Rap",
      bio: "Lyrical storytelling with modern beats",
      image: keia,
      links: {
        instagram: "https://www.instagram.com/iamakeia"
      },
      featured: true
    },
    {
      name: "Killer Choice",
      genre: "Alternative Rock, Punk",
      bio: "High-energy performances with punk attitude",
      image: killerChoice,
      links: {
        instagram: "https://www.instagram.com/killer.choice"
      },
      featured: true
    },
    {
      name: "Lex & Fly",
      genre: "R&B, Soul, Rock, Jazz",
      bio: "Fusion of soul and jazz with rock elements",
      image: lexFly,
      links: {
        instagram: "https://www.instagram.com/lexandfly"
      },
      featured: true
    },
    {
      name: "Lillode",
      genre: "Techno, EDM, Femme PC",
      bio: "Electronic producer with unique sound design",
      image: lillode,
      links: {
        instagram: "https://www.instagram.com/lillodeee"
      },
      featured: true
    },
    {
      name: "McWire",
      genre: "Alt, Indie, Nostalgic Pop, Ethereal",
      bio: "Dreamy soundscapes with nostalgic elements",
      image: mcwire,
      links: {
        instagram: "https://www.instagram.com/mcwir_e"
      },
      featured: true
    },
    {
      name: "Modayy",
      genre: "Hip-Hop, Rap",
      bio: "Modern rap with distinctive flow",
      image: modayy,
      links: {
        instagram: "https://www.instagram.com/gvo.mode"
      },
      featured: true
    },
    {
      name: "Morning Station",
      genre: "Folk Rock, Emo, Indie",
      bio: "Emotional lyrics with folk instrumentation",
      image: morningStation,
      links: {
        instagram: "https://www.instagram.com/morningstationn"
      },
      featured: true
    },
    {
      name: "Mulch",
      genre: "Nu Metal, Alt Rock",
      bio: "Heavy riffs with modern production",
      image: mulch,
      links: {
        instagram: "https://www.instagram.com/mulchbeat"
      },
      featured: true
    },
    {
      name: "Mutual Disdain",
      genre: "Indie Folk",
      bio: "Acoustic guitar and vocals, intimate performances from a solo artist",
      image: mutualDisdain,
      links: {
        instagram: "https://www.instagram.com/mutualdisdain"
      },
      featured: true
    },
    {
      name: "Not Milk",
      genre: "Indie Rock, Alt",
      bio: "Unique sound with experimental elements",
      image: notMilk,
      links: {
        instagram: "https://www.instagram.com/notmilknotmilknotmilknotmilkn"
      },
      featured: true
    },
    {
      name: "Not Really",
      genre: "Alt, Rock, Indie/Surf Rock",
      bio: "Surf-inspired indie rock with catchy melodies",
      image: notReally,
      links: {
        instagram: "https://www.instagram.com/not.reallymusic"
      },
      featured: true
    },
    {
      name: "Oak's Experiment",
      genre: "Indie, Rock, Alt, Ethereal",
      bio: "Experimental sound with atmospheric elements",
      image: oaksExperiment,
      links: {
        instagram: "https://www.instagram.com/oaks.experiment"
      },
      featured: true
    },
    {
      name: "Pale Hysteria",
      genre: "Screamo, Punk, Rock, Alternative",
      bio: "Intense vocal performances with punk instrumentation",
      image: paleHysteria,
      links: {
        instagram: "https://www.instagram.com/palehysteria"
      },
      featured: true
    },
    {
      name: "Pondscum",
      genre: "Alt, Metal, Rap, Experimental Free Improv Noise",
      bio: "Bass, guitar, drums, vocals, saxophone, didgeridoo, zurna, synthesizer",
      image: pondscum,
      links: {
        instagram: "https://www.instagram.com/pondscumpondscumpondsc"
      },
      featured: true
    },
    {
      name: "Quintin Tyevon",
      genre: "Hip-Hop",
      bio: "Lyrical hip-hop with personal storytelling",
      image: quintintyevon,
      links: {
        instagram: "https://www.instagram.com/quintintyevon"
      },
      featured: true
    },
    {
      name: "S4GE",
      genre: "Alternative, Experimental, Indie",
      bio: "Innovative sound with experimental production",
      image: s4ge,
      links: {
        instagram: "https://www.instagram.com/sAge.mp3"
      },
      featured: true
    },
    {
      name: "SATIN",
      genre: "Heavy Metal",
      bio: "Powerful metal with technical proficiency",
      image: satin,
      links: {
        instagram: "https://www.instagram.com/satintheband"
      },
      featured: true
    },
    {
      name: "Saturnalia",
      genre: "Indie Rock, Psychedelic Rock, Experimental",
      bio: "Vocals, Guitar, Bass, Drums, Synths",
      image: saturnalia,
      links: {
        instagram: "https://www.instagram.com/saturnalia.fl"
      },
      featured: true
    },
    {
      name: "SLIT",
      genre: "Rap/Hip-Hop",
      bio: "Modern rap with distinctive style",
      image: slitImg,
      links: {
        instagram: "https://www.instagram.com/slitt__"
      },
      featured: true
    },
    {
      name: "Soul Candy",
      genre: "Flower Pop, Pop, R&B, Soul",
      bio: "Soulful vocals with pop sensibility",
      image: soulCandy,
      links: {
        instagram: "https://www.instagram.com/soulcandyband_"
      },
      featured: true
    },
    {
      name: "Steen",
      genre: "Alt, Hip-Hop, Rap",
      bio: "Alternative hip-hop with unique production",
      image: steenImg,
      links: {
        instagram: "https://www.instagram.com/steen.music"
      },
      featured: true
    },
    {
      name: "Stoneheads",
      genre: "Nu Metal, Alt, Rock, Metal, Hip-Hop, Rap",
      bio: "Nu metal with vocals, guitar, bass, drums, rapping",
      image: stoneheads,
      links: {
        instagram: "https://www.instagram.com/_stoneheads_"
      },
      featured: true
    },
    {
      name: "Taint",
      genre: "Metal, Deathcore, Hardcore Punk",
      bio: "Extreme metal with hardcore influences",
      image: taint,
      links: {
        instagram: "https://www.instagram.com/fattaint"
      },
      featured: true
    },
    {
      name: "The Casualties",
      genre: "Pop, Alt, Rock, Queer Rock, Folk",
      bio: "Diverse sound with queer perspective",
      image: theCasualties,
      links: {
        instagram: "https://www.instagram.com/thecasualties"
      },
      featured: true
    },
    {
      name: "The Flirt",
      genre: "Pop Rock, Heavy Metal, Emo",
      bio: "Emotional rock with pop sensibilities",
      image: theFlirt,
      links: {
        instagram: "https://www.instagram.com/wearetheflirt"
      },
      featured: true
    },
    {
      name: "The Nova",
      genre: "Pop, Alt, Rock",
      bio: "Alternative rock with pop hooks",
      image: theNova,
      links: {
        instagram: "https://www.instagram.com/thenovatheband"
      },
      featured: true
    },
    {
      name: "The Retrograde",
      genre: "Blues, Rock n Roll, Rock",
      bio: "Classic rock sound with blues influences",
      image: theRetrograde,
      links: {
        instagram: "https://www.instagram.com/theretrogradeofficial"
      },
      featured: true
    },
    {
      name: "WormWorld",
      genre: "Punk, Rock",
      bio: "Raw punk energy with rock foundation",
      image: wormworld,
      links: {
        instagram: "https://www.instagram.com/wormworldband"
      },
      featured: true
    },
    {
      name: "YVSN",
      genre: "Hip-Hop",
      bio: "Contemporary hip-hop with unique style",
      image: yvsn,
      links: {
        instagram: "https://www.instagram.com/official.yvsn"
      },
      featured: true
    },
    {
      name: "AG Ritch",
      genre: "Rap, Hip-Hop",
      bio: "Authentic rap with powerful lyrics",
      image: agRitch,
      links: {
        instagram: "https://www.instagram.com/ag_ritch10"
      },
      featured: true
    },
    {
      name: "Facey",
      genre: "Rap, Trap Soul, Hip-Hop",
      bio: "Unique blend of trap and soulful hip-hop",
      image: facey,
      links: {
        instagram: "https://www.instagram.com/facey___"
      },
      featured: true
    },
];

// Sort artists alphabetically by name
artists.sort((a, b) => a.name.localeCompare(b.name));

const ArtistDirectory = () => {
    const [filter, setFilter] = useState('');
    const [genreFilter, setGenreFilter] = useState('');
    
    // Extract all unique genres
    const allGenres = [...new Set(
      artists.flatMap(artist => 
        artist.genre.split(', ').map(g => g.trim())
      )
    )].sort().filter(genre => genre !== 'Electronic'); // Filter out 'Electronic' genre
    
    // Filter artists based on search and genre
    const filteredArtists = artists.filter(artist => {
      const matchesSearch = artist.name.toLowerCase().includes(filter.toLowerCase()) ||
                           artist.bio.toLowerCase().includes(filter.toLowerCase());
      
      // If EDM is selected, also show artists with Electronic in their genre
      const matchesGenre = genreFilter === '' || 
                           artist.genre.toLowerCase().includes(genreFilter.toLowerCase()) ||
                           (genreFilter.toLowerCase() === 'edm' && artist.genre.toLowerCase().includes('electronic'));
      
      return matchesSearch && matchesGenre;
    });
  
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Tallahassee Music Scene</h1>
        
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium mb-1">Search Artists</label>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search by name, bio..."
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium mb-1">Filter by Genre</label>
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Genres</option>
              {allGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtists.map((artist, index) => (
            <div key={index} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold mb-2">{artist.name}</h2>
              <p className="text-gray-700 mb-1"><span className="font-medium">Genre:</span> {artist.genre}</p>
              <p className="text-gray-700 mb-1"><span className="font-medium">Bio:</span> {artist.bio}</p>
              {artist.links.instagram && (
                <p className="text-gray-700">
                  <span className="font-medium">Instagram:</span>{' '}
                  <a 
                    href={artist.links.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {artist.links.instagram.replace('https://www.instagram.com/', '@')}
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>
        
        {filteredArtists.length === 0 && (
          <p className="text-center text-gray-500 my-8">No artists found matching your criteria.</p>
        )}
        
        <p className="mt-6 text-gray-500 text-center">
          Showing {filteredArtists.length} of {artists.length} artists
        </p>
      </div>
    );
  };
  
  export default ArtistDirectory;