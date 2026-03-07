'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ArrowLeft, Trophy, RotateCcw, Send, Swords, Brain, Timer, Type } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'

// ─── Dictionary ──────────────────────────────────────────────────────────
// ~3000 common English words (3-12 letters, no obscene words)
const WORDS: string[] = [
  // A
  'ace','act','add','age','ago','aid','aim','air','all','and','ant','any','ape','arc','are','ark','arm','art','ash','ask','ate',
  'able','acid','acre','aged','also','area','army','atom','aunt','auto','avid','away','axis',
  'about','above','abuse','actor','acute','adapt','admit','adopt','adult','after','again','agent','agree','ahead','alarm',
  'album','alien','align','alike','alive','alley','allow','along','alter','among','ample','angel','anger','angle','angry',
  'anime','ankle','apart','apple','apply','arena','argue','arise','armor','aroma','array','arrow','aside','asset',
  'atlas','avoid','awake','award','aware',
  'absorb','absent','accept','access','across','acting','action','active','actual','adjust','admire','advice','advise',
  'afford','afraid','agency','agenda','almost','amount','animal','annual','answer','anyone','anyway','appeal','appear',
  'arrest','arrive','artist','aspect','assess','assign','assist','assume','assure','attach','attack','attend',
  'author','avenue',
  'ability','abolish','absence','absolve','abstract','academy','achieve','acquire','address','advance','adverse',
  'airline','alcohol','already','amazing','ancient','another','anxiety','anymore','applied','arrange','article',
  'assault','auction','average',
  // B
  'bad','bag','ban','bar','bat','bay','bed','bet','bid','big','bit','bow','box','boy','bud','bug','bus','but','buy',
  'back','bake','ball','band','bang','bank','bare','barn','base','bath','beam','bean','bear','beat','been','beer','bell',
  'belt','bend','best','bike','bill','bind','bird','bite','blow','blue','blur','boat','body','bold','bolt','bomb',
  'bond','bone','book','boom','boot','born','boss','both','bowl','bulk','bull','burn','busy',
  'badge','basic','basin','basis','batch','beach','begin','being','below','bench','berry','birth','black','blade','blame',
  'blank','blast','blaze','bleed','blend','bless','blind','block','bloom','blown','board','bonus','boost','booth','bound',
  'brain','brand','brave','bread','break','breed','brick','bride','brief','bring','broad','broke','brown','brush','buddy',
  'build','bunch','burst','buyer',
  'backup','banner','barely','barrel','basket','battle','beauty','become','before','behind','belong','beside','beyond',
  'bitter','blanket','borrow','bottle','bottom','bounce','branch','breath','breeze','bridge','bright','broken','bronze',
  'browse','bruise','bubble','bucket','budget','buffer','bundle','burden','button',
  'balance','barrier','battery','bearing','because','believe','beneath','benefit','besides','between','billion',
  'blossom','brother','brought','builder','burning','butcher',
  // C
  'cab','can','cap','car','cat','cup','cut',
  'cafe','cage','cake','call','calm','came','camp','card','care','cart','case','cash','cast','cave','cell','chat','chef',
  'chin','chip','chop','cite','city','clam','clan','clap','claw','clay','clip','club','clue','coat','code','coil',
  'coin','cold','colt','comb','come','cook','cool','cope','copy','cord','core','cork','corn','cost','cozy','crew',
  'crop','crow','cube','cure','curl','cute',
  'cable','camel','candy','cargo','carry','catch','cause','cease','chain','chair','chalk','champ','chaos','charm','chart',
  'chase','cheap','check','cheek','cheer','chess','chest','chief','child','chill','china','choir','chord','chunk','civic',
  'civil','claim','clash','class','clean','clear','clerk','click','cliff','climb','cling','clock','clone','close','cloth',
  'cloud','clown','coach','coast','color','comet','comic','coral','couch','could','count','court','cover','crack','craft',
  'crane','crash','crazy','cream','crime','crisp','cross','crowd','crown','crude','crush','curve','cycle',
  'cancel','carbon','career','castle','casual','caught','center','cereal','chance','change','charge','cheese',
  'cherry','choice','choose','chosen','circle','client','clinic','closet','coffee','collar','colony','column','combat',
  'comedy','coming','common','comply','corner','costly','cotton','county','couple','course','cousin','create','credit',
  'crisis','custom',
  'cabinet','calcium','caliber','capable','capital','captain','capture','careful','carrier','catalog','caution',
  'ceiling','central','century','certain','chamber','channel','chapter','charity','charter','cheaper','checker','chicken',
  'chronic','circuit','citizen','classic','climate','closing','cluster','coastal','collect','college',
  'combine','comfort','command','comment','compact','company','compare','compete','complex','compose','concept','concern',
  'conduct','confirm','connect','consent','consist','consult','contact','contain','content','contest','context','control',
  'convert','convict','correct','council','counter','country','courage',
  'creator','crucial','culture','current','cushion',
  // D
  'dad','dam','day','den','dew','did','dig','dim','dip','dot','dry','due','dug','duo','dye',
  'dale','dame','damp','dare','dark','dart','dash','data','date','dawn','dead','deaf','deal','dean','dear','debt','deck',
  'deed','deem','deep','deer','demo','deny','desk','dial','dice','diet','dirt','disc','dish','disk','dock','does','dome',
  'done','doom','door','dose','dove','down','drag','draw','drew','drip','drop','drum','dual','duck','dude','duel',
  'dull','dumb','dump','dune','dusk','dust','duty',
  'daily','dance','death','debut','delay','delta','dense','depot','depth','derby','devil','diary','dirty','disco','dizzy',
  'dodge','donor','doubt','dough','draft','drain','drama','drank','drawn','dream','dress','dried','drift','drill','drink',
  'drive','drone','drove','drunk','dusty','dwarf',
  'damage','danger','daring','dealer','debate','decade','decent','decide','decode','deeply','defeat','defend',
  'define','degree','delete','demand','denial','dental','depart','depend','deploy','deputy','derive','desert','design',
  'desire','detail','detect','device','devote','diesel','differ','digest','dinner','direct','divine','dollar','domain',
  'donate','double','driven','driver','during',
  'damaged','dealing','declare','decline','default','defence','deficit','deliver','density','deposit',
  'descent','deserve','desktop','despair','destroy','develop','devoted','dialect','diamond','digital','diploma','disable',
  'discard','discuss','disease','dismiss','display','dispute','distant','diverse','divided','divorce','dolphin',
  'dormant','dragged','dragon','dressed','dribble','dropped','drought','dynamic',
  // E
  'ear','eat','egg','elm','end','era','eve','eye',
  'each','earn','ease','east','easy','echo','edge','edit','else','emit','epic','even','ever','evil','exam','exit',
  'eager','early','earth','eight','elder','elect','elite','email','embed','empty','enemy','enjoy','enter','entry','equal',
  'equip','erase','error','essay','event','every','exact','exile','exist','extra',
  'earned','easily','eating','edited','editor','effect','effort','eighth','either','eldest','eleven','emerge','empire',
  'employ','enable','ending','endure','energy','engage','engine','enough','ensure','entire','entity','equity','escape',
  'estate','ethnic','evolve','exceed','except','excess','excite','excuse','exempt','exotic','expand','expect','expert',
  'export','expose','extend','extent',
  'earning','eastern','eclipse','ecology','economy','educate','elapsed','elderly','elected','elegant','element','elevate',
  'embrace','emotion','emperor','empower','enabled','endemic','endless','enforce','engaged','enhance','enquiry',
  'episode','erosion','essence','eternal','ethical','evident','examine','example','excited','exclude','execute','exhibit',
  'expense','explain','exploit','explore','express','extreme',
  // F
  'fan','far','fat','fax','fed','fee','few','fig','fin','fit','fix','fly','fog','for','fox','fry','fun','fur',
  'face','fact','fade','fail','fair','fake','fall','fame','fang','fare','farm','fast','fate','fawn','fear','feat','feed',
  'feel','fell','felt','file','fill','film','find','fine','fire','firm','fish','fist','five','flag','flat','flaw','fled',
  'flew','flex','flip','flow','foam','foil','fold','folk','fond','font','food','fool','foot','fork','form','fort',
  'foul','four','free','frog','from','fuel','full','fund','fury','fuse','fuss',
  'fable','fairy','faith','false','fancy','fatal','fault','favor','feast','fence','fetch','fewer','fiber','field','fifth',
  'fifty','fight','final','first','fixed','flame','flash','flask','fleet','flesh','flick','flies','fling','flint','float',
  'flock','flood','floor','flora','flour','fluid','flush','flute','focus','force','forge','forth','forum','found',
  'frame','frank','fraud','fresh','front','frost','froze','fruit','fully',
  'fabric','facial','factor','failed','fairly','fallen','family','famous','farmer','faster','father','faulty',
  'fellow','female','fender','fiasco','fiddle','fierce','figure','filter','finale','finger','finite',
  'fiscal','flavor','flight','flower','flying','follow','footer','forbid','forced','forest','forget','formal','format',
  'former','fossil','foster','fourth','freeze','frozen','frugal','fusion','future',
  'factory','faculty','failing','failure','fantasy','farther','fashion','fastest','fatigue','feature','federal',
  'fiction','fifteen','fighter','finance','finding','fishing','fitness','fixture','formula','fortune','forward','founded',
  'freedom','freight','funding','furnish','further',
  // G
  'gag','gap','gas','get','gin','got','gum','gun','gut','guy',
  'gain','gale','game','gang','gate','gave','gaze','gear','gene','gift','girl','give','glad','glow','glue','goat','goes',
  'gold','golf','gone','good','grab','gram','gray','grew','grid','grim','grin','grip','grit','grow','gulf',
  'gamble','garage','garden','garlic','gather','gently','gifted','giggle','ginger','global','glossy','golden','govern',
  'gravel','grease','greedy','ground','growth','grumpy','guilty','guitar',
  'gallery','garbage','gateway','general','genetic','genuine','geology','gesture','getting','glacial','glimpse','glitter',
  'glucose','gradual','grammar','granite','graphic','gravity','greater','greatly','grocery','growing','grumble',
  // H
  'had','ham','has','hat','hay','hen','her','hid','him','hip','his','hit','hog','hop','hot','how','hub','hue','hug','hum',
  'hack','hail','hair','half','hall','halt','hand','hang','hard','harm','harp','hate','haul','have','haze','head','heal',
  'heap','hear','heat','heel','held','help','herb','herd','here','hero','hide','high','hike','hill','hilt','hint','hire',
  'hold','hole','holy','home','hood','hook','hope','horn','hose','host','hour','huge','hull','hung','hunt','hurt','hush',
  'habit','happy','harsh','haste','haven','heart','heavy','hedge','heist','hello','hence','hobby','honey',
  'honor','horse','hotel','house','human','humor','hurry',
  'handle','hangar','happen','harbor','hardly','hassle','hatred','hazard','health','heaven','height','helmet','hidden',
  'highly','hiring','hollow','honest','horror','hosted','humble','hunger','hunter','hybrid',
  'habitat','halfway','halting','hamster','handler','handout','hanging','happier','happily','harbour','hardest','harmful',
  'harmony','harvest','heading','healing','healthy','hearing','heating','heavily','hedging','helpful','heroine','highway',
  'himself','history','hitting','holding','holiday','horizon','hormone','horrify','hostile','housing','however',
  'hundred','hunting','husband',
  // I
  'ice','ill','ink','inn','ion','its','ivy',
  'icon','idea','idle','idol',
  'ideal','image','imply','incur','index','indie','infer','inner','input','intro','irony','issue','ivory',
  'ignore','impact','import','impose','income','indoor','induce','infant','inform','inject','injury','inland',
  'inmate','insane','insect','insert','inside','insist','intact','intend','intent','invent','invest','invite','island',
  'illegal','imagine','imitate','immense','implant','implied','impress','improve','impulse','include','indexed','initial',
  'inquire','insight','inspect','install','instead','integer','intense','interim','invalid','involve','isolate',
  // J
  'jab','jam','jar','jaw','jet','jig','job','jog','jot','joy','jug',
  'jack','jade','jail','jazz','jean','jerk','jest','join','joke','jury','jump','just','jolt',
  'jewel','joint','jolly','joker','judge','juice','juicy','jumbo',
  'jacket','jagged','jargon','jersey','jigsaw','jostle','jungle','junior','justice',
  'jackpot','janitor','javelin','journal','journey','jubilee','judging','juggler','jumping','juniper','justify',
  // K
  'keg','key','kid','kin','kit',
  'keen','keep','kept','kick','kill','kind','king','kiss','kite','knee','knew','knit','knob','knot','know',
  'kayak','knack','knead','kneel','knife','knock','known',
  'keeper','kernel','kettle','kidney','killer','kindle','kindly','kitten','knight',
  'kitchen','kingdom','kinetic','knitted','knowing',
  // L
  'lab','lad','lag','lap','law','lay','led','leg','let','lid','lie','lip','lit','log','lot','low',
  'lack','laid','lake','lamb','lame','lamp','land','lane','lard','lark','last','late','lawn','lazy','lead','leaf','leak',
  'lean','leap','left','lend','lens','less','liar','lick','life','lift','like','limb','lime','limp','line','link',
  'lion','list','live','load','loaf','loan','lock','loft','logo','lone','long','look','loop','lord','lose','loss','lost',
  'loud','love','luck','lump','lure','lurk','lush','lust',
  'label','labor','large','laser','later','laugh','layer','learn','least','leave','legal','lemon','level','light',
  'limit','linen','liver','local','lodge','logic','login','loose','lover','lower','loyal','lucky','lunar','lunch','lying',
  'ladder','landed','laptop','lately','latest','latter','launch','lawyer','layout','leader','league','leaves','legacy',
  'legend','lender','lesson','letter','liable','likely','linear','lining','liquid','listen','litter','little','lively',
  'living','locate','locked','lonely','longer','lookup','losses','lovely','lowest','luxury',
  'landing','largely','lateral','laundry','lawsuit','leading','leaflet','learned','leather','leaving','lecture','legally',
  'leisure','lending','leopard','letdown','letting','liberal','liberty','library','licence','lightly','lighter','limited',
  'lineage','linking','listing','literal','loading','locally','logical','longest','looking','lottery','loyalty',
  // M
  'mad','man','map','mat','may','men','met','mid','mix','mob','mop','mud','mug',
  'made','mail','main','make','male','mall','malt','many','mark','mask','mass','mate','maze','meal','mean','meat','melt',
  'memo','mend','menu','mere','mesh','mess','mild','mile','milk','mill','mind','mine','mint','miss','mist','mode','mold',
  'mood','moon','more','moss','most','moth','move','much','mule','muse','must','myth',
  'magic','major','maker','manor','march','marry','match','mayor','medal','media','mercy','merit','metal','meter','might',
  'minor','minus','mixed','model','money','month','moral','motor','mount','mouse','mouth','movie','muddy','music',
  'maiden','mainly','making','manage','manner','margin','marine','marker','market','master','matter','meadow','medium',
  'member','memory','mental','mentor','merger','method','middle','mighty','miller','mingle','mining','minute','mirror',
  'misery','mobile','modern','modest','modify','module','moment','monkey','mortal','mostly','mother','motion','motive',
  'museum','mutual','myself','mystic',
  'machine','madness','magical','mandate','mansion','mapping','marital','married','massage','massive','mastery',
  'matched','matters','maximum','meaning','measure','medical','meeting','mention','mercury','merging','message',
  'migrate','militia','million','mineral','minimal','minimum','miracle','mission','mistake','mixture',
  'modular','monitor','monster','monthly','morning','mounted','mundane','musical','mystery',
  // N
  'nab','nag','nap','net','new','nil','nip','nod','nor','not','now','nun','nut',
  'nail','name','navy','near','neat','neck','need','nest','next','nice','nine','node','none','noon','norm','nose','note',
  'noun','nude',
  'naive','nasty','naval','nerve','never','newly','night','noble','noise','north','noted','novel','nurse',
  'namely','napkin','narrow','nation','native','nature','nearby','nearly','neatly','needed','needle','negate','nephew',
  'nerves','nested','neural','newest','nickel','nimble','nobody','normal','noting','notice','notion','novice',
  'number',
  'nailing','narrate','natural','nearest','nearing','neglect','neither','nervous','nesting','network',
  'neutral','nominal','notable','nothing','nuclear','nursing',
  // O
  'oak','oar','oat','odd','off','oil','old','one','opt','orb','ore','our','out','owe','owl','own',
  'obey','odds','okay','omit','once','only','onto','open','oral','oven','over','owed',
  'ocean','offer','often','olive','onset','opera','orbit','order','organ','other','outer','oxide','ozone',
  'object','oblige','obtain','occupy','offend','office','offset','online','oppose','option','orange','origin','orphan',
  'output','outset',
  'obesity','obliged','obscure','observe','obvious','offense','offered','officer','offline','ongoing',
  'opening','operate','opinion','opposed','optimum','organic','outcome','outdoor','outline','outlook',
  'outside','overall','overlap',
  // P
  'pad','pal','pan','pat','paw','pay','pea','peg','pen','per','pet','pie','pig','pin','pit','pod','pop','pot','pub',
  'pug','pun','pup','put',
  'pace','pack','page','paid','pain','pair','pale','palm','pane','park','part','pass','past','path','peak','peel','peer',
  'pick','pier','pile','pill','pine','pink','pipe','plan','play','plea','plot','plow','plug','plum','plus','poem',
  'poet','pole','poll','polo','pond','pool','poor','pore','pork','port','pose','post','pour','pray','prey','prop',
  'pull','pulp','pump','punk','pure','push',
  'panel','panic','paper','patch','pause','peace','peach','pearl','penny','phase','phone','photo','piano','piece','pilot',
  'pinch','pitch','pixel','pizza','place','plain','plane','plant','plate','plaza','plead','pluck','plumb','point','polar',
  'porch','pouch','pound','power','press','price','pride','prime','print','prior','prize','probe','prone','proof','proud',
  'prove','proxy','pulse','punch','pupil','purse',
  'pacing','packed','palace','parade','parent','parcel','pardon','parish','parked','partly','patrol','patron',
  'paving','paying','pencil','people','pepper','period','permit','person','phrase','picked','picnic','pierce','pillar',
  'pillow','planet','plasma','player','please','pledge','plenty','plunge','pocket','poetry','poison','police','policy',
  'polish','polite','portal','poster','potato','potent','potion','powder','praise','prayer','prefer','pretty','prince',
  'prison','profit','prompt','proper','proven','public','punish','puppet','pursue','puzzle',
  'package','painful','painter','parking','partial','partner','passage','passing','passive','patient','pattern','payment',
  'penalty','pending','pension','percent','perfect','perform','perhaps','persist','pianist','picture','pilgrim',
  'pioneer','plastic','plaster','plateau','platter','playful','pleased','plenary','plummet','pointed','popular',
  'portray','possess','pottery','poverty','powered','precise','predict','premier','prepare','present','prevent',
  'primary','printer','privacy','private','problem','proceed','process','produce','product','profile','program',
  'project','promise','promote','protect','protein','protest','provide','publish','pulling','purpose','pushing',
  'putting','puzzled',
  // Q
  'quad','quid','quit','quiz',
  'queen','query','quest','queue','quick','quiet','quilt','quirk','quite','quota','quote',
  'quarry','quench',
  'qualify','quality','quantum','quarter','queried','quickly',
  // R
  'rag','ram','ran','rap','rat','raw','ray','red','rib','rid','rig','rim','rip','rob','rod','rot','row','rub','rug',
  'run','rut',
  'race','rack','raft','rage','raid','rail','rain','rank','rare','rash','rate','rave','read','real','ream','reap','rear',
  'reed','reef','reel','rely','rent','rest','rice','rich','ride','rife','rift','ring','riot','rise','risk','road','roam',
  'roar','robe','rock','rode','role','roll','roof','room','root','rope','rose','ruin','rule','rush','rust',
  'radar','radio','raise','rally','ranch','range','rapid','ratio','reach','react','ready','realm','rebel','recap','refer',
  'reign','relax','relay','remit','renew','repay','reply','rider','ridge','rifle','right','rigid','rival','river','robin',
  'robot','rocky','rough','round','route','royal','rugby','rural',
  'rabbit','racial','racism','racing','racket','radius','ragged','raised','raisin','random','ranger','ranked','ransom',
  'rather','rating','reader','really','reason','reboot','recall','recent','recipe','record',
  'reduce','reform','refuge','refund','refuse','regard','regime','region','reject','relate','relief','remain','remark',
  'remedy','remind','remote','remove','render','rental','reopen','repair','repeat','report','rescue','resign','resist',
  'resort','result','resume','retail','retain','retire','return','reveal','review','revolt','reward','rhythm','ribbon',
  'robust','rocket','roller','rotate','ruling','runner','runway',
  'radical','railway','rainbow','raising','ranging','ranking','readily','reading','reality','realize','receipt','receive',
  'rebuild','recover','recruit','recycle','reduced','reflect','referee','refined','refresh','refugee','refusal','refused',
  'related','release','reliant','remains','removal','removed','renewed','replica','replied','reports','request','require',
  'reserve','reshape','resolve','respect','respond','restart','restore','retreat','reunite','revenue','reverse','revival',
  'revolve','roughly','routine','royalty','running','rupture',
  // S
  'sad','sat','saw','say','sea','set','sew','she','shy','sin','sip','sir','sit','six','ski','sky','sob','sod','son',
  'sow','spy','sub','sue','sum','sun','sup',
  'safe','sage','said','sail','sake','sale','salt','same','sand','sane','sang','sank','save','scan','seal','seam','seat',
  'seed','seek','seem','seen','self','sell','send','sent','shed','shin','ship','shop','shot','show','shut','sick','side',
  'sift','sigh','sign','silk','silo','sing','sink','site','size','skim','skin','skip','slab','slam','slap','sled','slew',
  'slid','slim','slip','slit','slot','slow','slug','snap','snip','snow','snub','soak','soap','soar','sock','soda','sofa',
  'soft','soil','sold','sole','some','song','soon','sore','sort','soul','sour','span','spar','spec','sped','spin','spit',
  'spot','star','stay','stem','step','stew','stir','stop','stub','stud','such','suit','sulk','sure','surf','swan','swap',
  'swim','sync',
  'sadly','saint','salad','salon','sauce','scale','scare','scene','scope','score','scout','scrap','sense','serve',
  'seven','shade','shaft','shake','shall','shame','shape','share','sharp','shave','sheep','sheer','sheet','shelf','shell',
  'shift','shine','shirt','shock','shoot','shore','short','shout','shown','sight','since','sixth','sixty','skill','skull',
  'slash','slate','slave','sleep','slice','slide','slope','small','smart','smell','smile','smith','smoke','snake','solar',
  'solid','solve','sorry','sound','south','space','spare','spark','speak','speed','spend','spent','spice','spill','spine',
  'split','spoke','spoon','sport','spray','squad','stack','staff','stage','stain','stake','stale','stall','stamp','stand',
  'stark','start','state','stave','stays','steak','steal','steam','steel','steep','steer','stern','stick','stiff','still',
  'stock','stole','stone','stood','stool','store','storm','story','stove','strap','straw','stray','strip','stuck','study',
  'stuff','style','sugar','suite','super','surge','swamp','swear','sweat','sweep','sweet','swept','swift','swing','sword',
  'scoop','shrug','silly','spore','squid','sting','stink','stork','stout','stump','sunny','swirl',
  'sacred','safely','safety','salary','salmon','sample','sanity','savage','saving','scarce','scenic','scheme','school',
  'scrape','screen','script','scroll','sealed','search','season','second','secret','sector','secure','seeing','seeker',
  'select','seller','senior','serial','series','server','settle','severe','shadow','shaken','shaped','shield','shower',
  'shrink','signal','silent','silver','simple','simply','single','sister','sketch','sleeve','slight','smooth','snatch',
  'social','socket','soften','solely','solemn','sought','source','speech','sphere','spider','spirit','splash','spoken',
  'spread','spring','square','stable','stance','statue','status','steady','stolen','strain','strand','streak','stream',
  'street','stress','strict','stride','strike','string','stripe','stroke','strong','struck','studio','submit','subtle',
  'sudden','suffer','summit','Sunday','sunset','superb','supply','surely','survey','switch','symbol','syntax','system',
  'sadness','scatter','scholar','science','scratch','section','segment','selfish','seminar','senator','sensing',
  'serious','servant','serving','session','setting','settled','several','shelter','sheriff','shocked','shortly',
  'shutter','sibling','sidebar','silence','similar','sitting','sixteen','skeptic','skilled','slavery','slender','slicing',
  'slipped','smaller','smiling','smoking','snippet','society','soldier','somehow','sorting','speaker','special','specify',
  'sponsor','squeeze','stadium','stamina','standby','started','starter','station','statute','staying',
  'stealth','storage','student','stumble','subject','subsidy','succeed','success','suggest','summary','support','supreme',
  'surface','surgeon','surplus','survive','suspect','suspend','sustain','sweater','swiftly',
  // T
  'tab','tag','tan','tap','tar','tax','tea','ten','the','tie','tin','tip','toe','ton','too','top','tow','toy','try','tub',
  'tug','two',
  'tack','tail','take','tale','talk','tall','tame','tank','tape','task','taxi','team','tear','tell','temp','tend','tent',
  'term','test','text','than','that','them','then','they','thin','this','thus','tick','tide','tidy','tied','tier','tile',
  'till','tilt','time','tiny','tire','toad','toil','told','toll','tomb','tone','took','tool','tops','tore','torn','toss',
  'tour','town','trap','tray','tree','trek','trim','trio','trip','trot','true','tube','tuck','tune','turf','turn','twin',
  'type',
  'table','taken','taste','teach','tempo','tense','terms','theme','thick','thief','thing','think','third','thorn','those',
  'three','threw','throw','thumb','tiger','tight','timer','tired','title','toast','today','token','topic','total','touch',
  'tough','tower','toxic','trace','track','trade','trail','train','trait','trash','treat','trend','trial','tribe','trick',
  'tried','troop','truck','truly','trunk','trust','truth','tumor','twice','twist',
  'tablet','tactic','tailor','taking','talent','target','taught','teapot','temple','tenant','tender','terror','thanks',
  'theirs','thirty','though','thread','threat','thrill','thrive','throne','thrown','thrust','ticket','timber','timing',
  'tissue','toggle','tongue','toward','traced','travel','treaty','tribal','trophy','tunnel','twelve','twenty',
  'tackle','turkey','turner','turtle','tycoon',
  'takeoff','talking','tapping','teacher','tearing','tedious','telling','terrain','terrify','testing','textile','theater',
  'therapy','thereby','thermal','thicker','thinker','thought','through','thunder','tobacco','tonight','torture',
  'touched','tourism','tourist','towards','tracker','trading','traffic','tragedy','trailer','trained','trainer','transit',
  'trapped','travels','trigger','triumph','trivial','trouble','trumpet','trustee','tsunami','tuition','turning',
  'typical','tyranny',
  // U
  'urn','use',
  'ugly','undo','unit','unto','upon','urge','used','user',
  'ultra','under','undue','union','unite','unity','until','upper','upset','urban','usage','usual','utter',
  'unable','undone','unfair','unfold','unique','united','unless','unlike','unlock','unrest','unsafe','unseen','untold',
  'unused','unveil','update','uphold','upload','upside','uptake','uptown','upward','urgent','usable','useful',
  'unclear','undergo','uniform','unknown','unleash','unusual','upgrade','upright','upstart',
  'uranium','urgency','utility',
  // V
  'van','vat','vet','via','vow',
  'vain','vale','vane','vary','vast','veil','vein','vent','verb','very','vest','veto','vice','view','vine','void','volt',
  'vote',
  'valid','value','vapor','vault','venue','verse','video','vigor','viral','virus','visit','vista','vital','vivid','vocal',
  'vodka','voice','voter','vouch',
  'vacant','vacuum','valley','valued','vanish','varied','vector','velvet','vendor','vessel','viable','victim','viewer',
  'violin','virgin','virtue','vision','visual','volume','vortex','voting','voyage','vulgar',
  'vacancy','vaccine','vaguely','vanilla','variety','various','vehicle','venture','verdict','version','veteran','vibrant',
  'victory','village','vinegar','vintage','violate','violent','virtual','visible','visitor','voltage','voucher',
  // W
  'wag','war','was','wax','way','web','wed','wet','who','why','wig','win','wit','woe','wok','won','woo','wow',
  'wade','wage','wait','wake','walk','wall','wand','want','ward','warm','warn','warp','wary','wash','wave','wavy','weak',
  'wear','weed','week','well','went','were','west','what','when','whom','wide','wife','wild','will','wilt','wind',
  'wine','wing','wink','wipe','wire','wise','wish','with','woke','wolf','womb','wood','wool','word','wore','work','worm',
  'worn','wove','wrap',
  'waste','watch','water','weary','weave','wedge','weigh','weird','whale','wheat','wheel','where','which','while','white',
  'whole','whose','widen','woman','world','worry','worse','worst','worth','would','wound','wrath','write','wrong','wrote',
  'waiter','walker','wander','wanted','warden','warmth','warned','washer','wealth','weapon','weekly','weight','wicked',
  'widely','wilder','window','winner','winter','wisdom','within','wizard','wonder','wooden','worker','worthy','writer',
  'wallet','walnut','waving',
  'waiting','walking','wanting','warfare','warming','warning','warrant','washing','wasting','watched','watcher',
  'wealthy','wearing','weather','website','wedding','weekend','welcome','welfare','western','whisper','whoever','winding',
  'winning','wishful','witness','wording','worried','worship','wrapped','writing','written',
  // X
  'xenon',
  // Y
  'yak','yam','yap','yaw',
  'yard','yarn','year','yell','yoga','yoke','your',
  'yacht','yearn','yield','young','youth',
  'yearly','yellow',
  // Z
  'zap','zen','zip','zoo',
  'zeal','zero','zinc','zone','zoom',
  'zigzag','zombie','zenith',
]

// ─── Build word index by starting letter ─────────────────────────────────
function buildWordIndex(words: string[]): Record<string, string[]> {
  const index: Record<string, string[]> = {}
  const seen = new Set<string>()
  for (const w of words) {
    const lower = w.toLowerCase()
    if (seen.has(lower)) continue
    seen.add(lower)
    const letter = lower[0]
    if (!index[letter]) index[letter] = []
    index[letter].push(lower)
  }
  return index
}

// ─── Types ───────────────────────────────────────────────────────────────
type GameState = 'menu' | 'playing' | 'finished'
type Difficulty = 'easy' | 'medium' | 'hard'
type Turn = 'player' | 'ai'

interface WordEntry {
  word: string
  by: Turn
}

const DIFFICULTY_CONFIG: Record<Difficulty, { turnTime: number; label: string; description: string; aiFails: boolean; aiPreferLong: boolean }> = {
  easy:   { turnTime: 15, label: 'Easy',   description: 'Warm-up round — 15s per turn', aiFails: true, aiPreferLong: false },
  medium: { turnTime: 10, label: 'Medium', description: 'The real deal — 10s per turn', aiFails: false, aiPreferLong: false },
  hard:   { turnTime: 7,  label: 'Hard',   description: 'No mercy — 7s per turn', aiFails: false, aiPreferLong: true },
}

const TOTAL_GAME_TIME = 90 // seconds

const BACK_LINK_TEXT = 'Games'

export default function WordChainPage() {
  const { user } = useAuth()
  const wordIndex = useMemo(() => buildWordIndex(WORDS), [])
  const validWordSet = useMemo(() => new Set(WORDS.map(w => w.toLowerCase())), [])

  const [gameState, setGameState] = useState<GameState>('menu')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [words, setWords] = useState<WordEntry[]>([])
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set())
  const [currentLetter, setCurrentLetter] = useState('')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [turnTimer, setTurnTimer] = useState(0)
  const [totalTimer, setTotalTimer] = useState(TOTAL_GAME_TIME)
  const [score, setScore] = useState(0)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOverReason, setGameOverReason] = useState('')
  const [longestWord, setLongestWord] = useState('')
  const [aiThinking, setAiThinking] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const wordsEndRef = useRef<HTMLDivElement>(null)
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null)
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null)
  const gameOverRef = useRef(false)
  const scoreRef = useRef(0)
  const wordsRef = useRef<WordEntry[]>([])
  const totalTimerValRef = useRef(TOTAL_GAME_TIME)
  const longestWordRef = useRef('')

  const config = DIFFICULTY_CONFIG[difficulty]

  // Keep refs in sync
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { wordsRef.current = words }, [words])
  useEffect(() => { totalTimerValRef.current = totalTimer }, [totalTimer])
  useEffect(() => { longestWordRef.current = longestWord }, [longestWord])

  // ─── End game ────────────────────────────────────────────────────────
  const endGame = useCallback((reason: string, finalScore?: number) => {
    if (gameOverRef.current) return
    gameOverRef.current = true
    if (turnTimerRef.current) clearInterval(turnTimerRef.current)
    if (totalTimerRef.current) clearInterval(totalTimerRef.current)
    setGameOverReason(reason)
    const s = finalScore ?? scoreRef.current
    setScore(s)
    setGameState('finished')

    // Submit score
    fetch('/api/games/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_type: 'word_chain',
        score: Math.max(0, Math.min(100, s)),
        metadata: {
          words_played: wordsRef.current.length,
          difficulty,
          total_time_seconds: TOTAL_GAME_TIME - totalTimerValRef.current,
          longest_word: longestWordRef.current,
        },
      }),
    }).catch(() => {})
  }, [difficulty])

  // ─── Start game ──────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const letters = 'abcdefghilmnoprstuw'
    const startLetter = letters[Math.floor(Math.random() * letters.length)]
    gameOverRef.current = false
    setWords([])
    setUsedWords(new Set())
    setCurrentLetter(startLetter)
    setInput('')
    setError('')
    setScore(0)
    scoreRef.current = 0
    wordsRef.current = []
    totalTimerValRef.current = TOTAL_GAME_TIME
    longestWordRef.current = ''
    setTurnTimer(config.turnTime)
    setTotalTimer(TOTAL_GAME_TIME)
    setIsPlayerTurn(true)
    setGameOverReason('')
    setLongestWord('')
    setAiThinking(false)
    setGameState('playing')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [config.turnTime])

  // ─── Turn timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== 'playing' || !isPlayerTurn) return
    setTurnTimer(config.turnTime)
    turnTimerRef.current = setInterval(() => {
      setTurnTimer(prev => {
        if (prev <= 1) {
          endGame('Time ran out on your turn!')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (turnTimerRef.current) clearInterval(turnTimerRef.current) }
  }, [gameState, isPlayerTurn, config.turnTime, endGame])

  // ─── Total game timer ────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== 'playing') return
    totalTimerRef.current = setInterval(() => {
      setTotalTimer(prev => {
        if (prev <= 1) {
          endGame('Game time is up! Great run!')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (totalTimerRef.current) clearInterval(totalTimerRef.current) }
  }, [gameState, endGame])

  // ─── Scroll to bottom on new word ────────────────────────────────────
  useEffect(() => {
    wordsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [words])

  // ─── AI turn ─────────────────────────────────────────────────────────
  const aiPlay = useCallback((letter: string, used: Set<string>) => {
    if (gameOverRef.current) return
    setAiThinking(true)
    const delay = 600 + Math.random() * 800

    setTimeout(() => {
      if (gameOverRef.current) return

      // On easy, AI sometimes "fails"
      if (config.aiFails && Math.random() < 0.15) {
        setAiThinking(false)
        endGame('The AI couldn\'t think of a word — you win!')
        return
      }

      const available = (wordIndex[letter] || []).filter(w => !used.has(w))
      if (available.length === 0) {
        setAiThinking(false)
        endGame('The AI ran out of words — you win!')
        return
      }

      let aiWord: string
      if (config.aiPreferLong) {
        // Hard mode: prefer longer words
        const sorted = [...available].sort((a, b) => b.length - a.length)
        aiWord = sorted[Math.floor(Math.random() * Math.min(3, sorted.length))]
      } else {
        aiWord = available[Math.floor(Math.random() * available.length)]
      }

      const newEntry: WordEntry = { word: aiWord, by: 'ai' }
      const newUsed = new Set(used)
      newUsed.add(aiWord)
      const nextLetter = aiWord[aiWord.length - 1]

      // Check if player has any valid words
      const playerOptions = (wordIndex[nextLetter] || []).filter(w => !newUsed.has(w))

      setWords(prev => [...prev, newEntry])
      setUsedWords(newUsed)
      setCurrentLetter(nextLetter)
      setAiThinking(false)
      setIsPlayerTurn(true)

      if (playerOptions.length === 0) {
        setTimeout(() => endGame('No valid words left starting with "' + nextLetter.toUpperCase() + '" — tough luck!'), 300)
      } else {
        setTimeout(() => inputRef.current?.focus(), 50)
      }
    }, delay)
  }, [config.aiFails, config.aiPreferLong, wordIndex, endGame])

  // ─── Player submit ───────────────────────────────────────────────────
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    if (gameOverRef.current || !isPlayerTurn) return

    const word = input.trim().toLowerCase()
    setInput('')

    if (word.length < 3) {
      setError('Word must be at least 3 letters')
      return
    }
    if (word[0] !== currentLetter) {
      setError(`Word must start with "${currentLetter.toUpperCase()}"`)
      return
    }
    if (!validWordSet.has(word)) {
      setError(`"${word}" is not in the dictionary`)
      return
    }
    if (usedWords.has(word)) {
      setError(`"${word}" was already used`)
      return
    }

    // Valid word!
    setError('')
    if (turnTimerRef.current) clearInterval(turnTimerRef.current)

    const wordScore = 5 + (word.length - 3) * 2
    const speedBonus = Math.floor((turnTimer / config.turnTime) * 3)
    const earned = wordScore + speedBonus

    const newEntry: WordEntry = { word, by: 'player' }
    const newUsed = new Set(usedWords)
    newUsed.add(word)
    const nextLetter = word[word.length - 1]

    setWords(prev => [...prev, newEntry])
    setUsedWords(newUsed)
    setCurrentLetter(nextLetter)
    setScore(prev => Math.min(100, prev + earned))
    setIsPlayerTurn(false)
    if (word.length > longestWord.length) setLongestWord(word)

    // AI's turn
    aiPlay(nextLetter, newUsed)
  }, [input, currentLetter, validWordSet, usedWords, isPlayerTurn, turnTimer, config.turnTime, longestWord, aiPlay])

  // ─── Format time ─────────────────────────────────────────────────────
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // ─── Result message ──────────────────────────────────────────────────
  const getResultMessage = (s: number) => {
    if (s >= 80) return 'Legendary wordsmith. The dictionary bows to you.'
    if (s >= 60) return 'Sharp tongue, sharper mind. Well played.'
    if (s >= 40) return 'Not bad — your vocabulary held its ground.'
    if (s >= 20) return 'Room for improvement. Keep reading those books.'
    return 'The AI had the last laugh this time.'
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MENU STATE
  // ═══════════════════════════════════════════════════════════════════════
  if (gameState === 'menu') {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Swords className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2 font-display tracking-wide">
          WORD CHAIN BATTLE
        </h1>
        <p className="text-muted-foreground mb-2">
          Each word starts with the last letter of the previous — think fast or lose
        </p>
        <p className="text-xs text-muted-foreground/60 italic mb-8">
          You vs the AI. Take turns building a chain. No repeats. No mercy.
        </p>

        {/* Difficulty selector */}
        <div className="flex gap-2 justify-center mb-8">
          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                difficulty === d
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {DIFFICULTY_CONFIG[d].label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-6">{config.description}</p>

        <button
          onClick={startGame}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors font-display tracking-widest"
        >
          <Swords className="w-4 h-4" />
          BEGIN
        </button>
        <div className="mt-6">
          <Link href="/games" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-3 h-3 inline mr-1" />
            Back to {BACK_LINK_TEXT}
          </Link>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FINISHED STATE
  // ═══════════════════════════════════════════════════════════════════════
  if (gameState === 'finished') {
    const playerWords = words.filter(w => w.by === 'player')
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2 font-display tracking-wide">
          GAME OVER
        </h1>
        <p className="text-sm text-muted-foreground mb-4">{gameOverReason}</p>

        <div className="flex justify-center gap-6 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary font-mono">{score}</p>
            <p className="text-xs text-muted-foreground">score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary font-mono">{playerWords.length}</p>
            <p className="text-xs text-muted-foreground">your words</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary font-mono">{words.length}</p>
            <p className="text-xs text-muted-foreground">chain length</p>
          </div>
        </div>

        {longestWord && (
          <p className="text-xs text-muted-foreground mb-2">
            Longest word: <span className="font-mono text-primary font-bold">{longestWord}</span>
          </p>
        )}
        <p className="text-muted-foreground mb-8 italic">{getResultMessage(score)}</p>

        {/* Word chain review */}
        {words.length > 0 && (
          <div className="mb-8 max-h-40 overflow-y-auto rock-card rounded-xl p-3">
            <div className="flex flex-wrap gap-1 justify-center">
              {words.map((entry, i) => (
                <span key={i} className="inline-flex items-center gap-0.5">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                    entry.by === 'player'
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'bg-secondary text-muted-foreground'
                  }`}>
                    {entry.word}
                  </span>
                  {i < words.length - 1 && <span className="text-muted-foreground/30 text-xs mx-0.5">&rarr;</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setGameState('menu') }}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors font-display tracking-widest"
          >
            <RotateCcw className="w-4 h-4" />
            PLAY AGAIN
          </button>
          <Link
            href="/games"
            className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-full font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {BACK_LINK_TEXT}
          </Link>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PLAYING STATE
  // ═══════════════════════════════════════════════════════════════════════
  const turnPercent = (turnTimer / config.turnTime) * 100
  const totalPercent = (totalTimer / TOTAL_GAME_TIME) * 100

  return (
    <div className="max-w-lg mx-auto">
      {/* Top stats bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
            <Timer className="w-3.5 h-3.5" />
            {formatTime(totalTimer)}
          </div>
          <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
            <Type className="w-3.5 h-3.5" />
            {words.length} words
          </div>
        </div>
        <div className="text-sm font-mono text-primary font-bold">
          {score} pts
        </div>
      </div>

      {/* Total timer bar */}
      <div className="w-full h-1 bg-secondary rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-primary/30 transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${totalPercent}%` }}
        />
      </div>

      {/* Game area */}
      <div className="rock-card rounded-2xl p-4 sm:p-6">
        {/* Required letter */}
        <div className="text-center mb-4">
          <p className="text-xs text-muted-foreground mb-1">
            {words.length === 0 ? 'Start with the letter' : 'Next word must start with'}
          </p>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/30">
            <span className="text-3xl font-bold text-primary font-mono uppercase">{currentLetter}</span>
          </div>
        </div>

        {/* Turn timer (player only) */}
        {isPlayerTurn && (
          <div className="w-full h-2 bg-secondary rounded-full mb-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                turnPercent > 40 ? 'bg-primary' : turnPercent > 20 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${turnPercent}%` }}
            />
          </div>
        )}

        {/* Word chain display */}
        <div className="min-h-[120px] max-h-[240px] overflow-y-auto mb-4 space-y-1.5 px-1" style={{ scrollbarWidth: 'thin' }}>
          {words.length === 0 && (
            <p className="text-center text-muted-foreground/50 text-sm py-8">
              Type a word starting with &ldquo;{currentLetter.toUpperCase()}&rdquo; to begin
            </p>
          )}
          {words.map((entry, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 text-sm animate-in slide-in-from-bottom-2 duration-200 ${
                entry.by === 'player' ? 'justify-end' : 'justify-start'
              }`}
            >
              {entry.by === 'ai' && (
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <Brain className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              <span className={`font-mono px-3 py-1.5 rounded-xl text-sm ${
                entry.by === 'player'
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'bg-secondary text-foreground'
              }`}>
                <span className="font-bold">{entry.word[0].toUpperCase()}</span>
                {entry.word.slice(1)}
              </span>
              {entry.by === 'player' && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-primary">You</span>
                </div>
              )}
            </div>
          ))}
          {aiThinking && (
            <div className="flex items-center gap-2 text-sm animate-in slide-in-from-bottom-2">
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Brain className="w-3 h-3 text-muted-foreground" />
              </div>
              <span className="bg-secondary text-muted-foreground px-3 py-1.5 rounded-xl text-sm italic">
                thinking<span className="animate-pulse">...</span>
              </span>
            </div>
          )}
          <div ref={wordsEndRef} />
        </div>

        {/* Error message */}
        {error && (
          <div className="text-center mb-2 animate-in fade-in duration-200">
            <p className="text-xs text-red-500 font-medium">{error}</p>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder={isPlayerTurn ? `Word starting with "${currentLetter.toUpperCase()}"...` : 'AI is thinking...'}
            disabled={!isPlayerTurn || gameOverRef.current}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!isPlayerTurn || !input.trim() || gameOverRef.current}
            className="bg-primary text-primary-foreground px-4 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Quit button */}
      <div className="text-center mt-4">
        <button
          onClick={() => { endGame('You quit the game.') }}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <RotateCcw className="w-3 h-3 inline mr-1" />
          End game
        </button>
      </div>
    </div>
  )
}
